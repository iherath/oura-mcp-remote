import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  ouraApiToken: string;
  createdAt: Date;
}

export interface UserSession {
  userId: string;
  username: string;
  email: string;
}

export class UserManager {
  private users: Map<string, User> = new Map();
  private jwtSecret: string;

  constructor(jwtSecret: string) {
    this.jwtSecret = jwtSecret;
  }

  async registerUser(username: string, email: string, password: string, ouraApiToken: string): Promise<User> {
    // Check if user already exists
    for (const user of this.users.values()) {
      if (user.email === email) {
        throw new Error('User with this email already exists');
      }
      if (user.username === username) {
        throw new Error('Username already taken');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user: User = {
      id: this.generateUserId(),
      username,
      email,
      passwordHash,
      ouraApiToken,
      createdAt: new Date(),
    };

    this.users.set(user.id, user);
    return user;
  }

  async authenticateUser(email: string, password: string): Promise<string> {
    // Find user by email
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );

    return token;
  }

  async validateToken(token: string): Promise<UserSession> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      const user = this.users.get(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        userId: user.id,
        username: user.username,
        email: user.email,
      };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  getUserOuraToken(userId: string): string | null {
    const user = this.users.get(userId);
    return user?.ouraApiToken || null;
  }

  async updateOuraToken(userId: string, ouraApiToken: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.ouraApiToken = ouraApiToken;
    this.users.set(userId, user);
  }

  storeOuraTokenForSession(userId: string, ouraApiToken: string): void {
    // Store Oura token for a session-based user (not registered)
    const user: User = {
      id: userId,
      username: 'oura_user',
      email: 'oura_user@example.com',
      passwordHash: '', // Not needed for session-based users
      ouraApiToken,
      createdAt: new Date(),
    };
    
    this.users.set(userId, user);
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load test users for development
  async loadTestUsers(): Promise<void> {
    if (this.users.size > 0) {
      return; // Already loaded
    }

    const testUsers = [
      {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        ouraApiToken: process.env.TEST_OURA_TOKEN || 'test-token',
      },
    ];

    for (const testUser of testUsers) {
      try {
        await this.registerUser(
          testUser.username,
          testUser.email,
          testUser.password,
          testUser.ouraApiToken
        );
      } catch (error) {
        // User might already exist, ignore
        console.log(`Test user ${testUser.username} already exists or failed to create`);
      }
    }

    console.log(`Loaded ${this.users.size} test users`);
  }

  // Get all users (for debugging)
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
} 