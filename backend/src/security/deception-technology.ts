import express from 'express';
import { Request, Response } from 'express';
import { financialAudit } from './zero-trust';

// Sistema de Deception Technology - Armadilhas para Hackers
export class DeceptionTechnology {
  private static fakeApp: express.Application;
  private static honeypots: Map<string, any> = new Map();
  private static attackLogs: any[] = [];

  static initialize() {
    this.fakeApp = express();
    this.setupHoneypots();
    this.startFakeServer();
  }

  private static setupHoneypots() {
    // Honeypot 1: Arquivo .env falso
    this.fakeApp.get('/.env', (req: Request, res: Response) => {
      this.logAttack(req, 'ENV_FILE_ACCESS');
      res.send(`
# 🔥 ARMADILHA ATIVADA - HACKER CAPTURADO! 🔥
FAKE_DB_URL=mysql://root:password@fake-db:3306
FAKE_API_KEY=sk_test_fake_key_123456789
FAKE_JWT_SECRET=super_secret_fake_key
FAKE_ADMIN_PASSWORD=admin123
FAKE_CREDIT_CARD=4111111111111111
      `);
    });

    // Honeypot 2: Endpoint de admin falso
    this.fakeApp.get('/admin', (req: Request, res: Response) => {
      this.logAttack(req, 'ADMIN_ACCESS');
      res.json({
        success: true,
        message: 'Admin panel accessed',
        users: [
          { id: 1, email: 'admin@fake.com', role: 'super_admin' },
          { id: 2, email: 'user@fake.com', role: 'user' }
        ],
        system: {
          version: '1.0.0',
          status: 'vulnerable',
          debug: true
        }
      });
    });

    // Honeypot 3: API de usuários falso
    this.fakeApp.get('/api/users', (req: Request, res: Response) => {
      this.logAttack(req, 'USERS_API_ACCESS');
      res.json([
        { id: 1, name: 'John Doe', email: 'john@fake.com', password: 'password123' },
        { id: 2, name: 'Jane Smith', email: 'jane@fake.com', password: 'qwerty456' }
      ]);
    });

    // Honeypot 4: Endpoint de backup falso
    this.fakeApp.get('/backup', (req: Request, res: Response) => {
      this.logAttack(req, 'BACKUP_ACCESS');
      res.send('Database backup file - 2024-01-01.sql');
    });

    // Honeypot 5: Endpoint de configuração falso
    this.fakeApp.get('/config', (req: Request, res: Response) => {
      this.logAttack(req, 'CONFIG_ACCESS');
      res.json({
        database: {
          host: 'fake-db.example.com',
          port: 5432,
          username: 'admin',
          password: 'super_secret_password'
        },
        redis: {
          host: 'fake-redis.example.com',
          password: 'redis_password_123'
        }
      });
    });

    // Honeypot 6: Endpoint de logs falso
    this.fakeApp.get('/logs', (req: Request, res: Response) => {
      this.logAttack(req, 'LOGS_ACCESS');
      res.send(`
2024-01-01 10:00:00 - User login: admin@fake.com
2024-01-01 10:01:00 - Database query: SELECT * FROM users
2024-01-01 10:02:00 - File access: /etc/passwd
      `);
    });

    // Honeypot 7: Endpoint de debug falso
    this.fakeApp.get('/debug', (req: Request, res: Response) => {
      this.logAttack(req, 'DEBUG_ACCESS');
      res.json({
        debug: true,
        environment: 'development',
        database: 'connected',
        redis: 'connected',
        secrets: {
          jwt: 'fake_jwt_secret_123',
          encryption: 'fake_encryption_key_456'
        }
      });
    });

    // Honeypot 8: Endpoint de SQL injection falso
    this.fakeApp.get('/search', (req: Request, res: Response) => {
      const query = req.query.q as string;
      if (query && this.detectSQLInjection(query)) {
        this.logAttack(req, 'SQL_INJECTION_ATTEMPT', { query });
        res.json({
          success: true,
          results: [
            { id: 1, name: 'Fake User 1', email: 'fake1@example.com' },
            { id: 2, name: 'Fake User 2', email: 'fake2@example.com' }
          ]
        });
      } else {
        res.json({ success: false, message: 'No results found' });
      }
    });

    // Honeypot 9: Endpoint de upload falso
    this.fakeApp.post('/upload', (req: Request, res: Response) => {
      this.logAttack(req, 'FILE_UPLOAD_ATTEMPT');
      res.json({
        success: true,
        message: 'File uploaded successfully',
        filename: 'malware.exe',
        size: '1024 bytes'
      });
    });

    // Honeypot 10: Endpoint de execução de comando falso
    this.fakeApp.post('/execute', (req: Request, res: Response) => {
      const command = req.body.command;
      this.logAttack(req, 'COMMAND_EXECUTION_ATTEMPT', { command });
      res.json({
        success: true,
        output: 'Command executed successfully',
        result: 'fake_command_result'
      });
    });
  }

  private static detectSQLInjection(query: string): boolean {
    const sqlPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i,
      /or\s+1\s*=\s*1/i,
      /'?\s*or\s*'?'\s*=\s*'?'/i,
      /;\s*drop/i,
      /;\s*delete/i,
      /;\s*insert/i
    ];

    return sqlPatterns.some(pattern => pattern.test(query));
  }

  private static logAttack(req: Request, attackType: string, details?: any) {
    const attack = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      attackType,
      details,
      headers: req.headers
    };

    this.attackLogs.push(attack);

    // Log crítico para auditoria
    console.log(`🔥🔥🔥 HONEYPOT ATIVADO! 🔥🔥🔥`);
    console.log(`🚨 Tipo de Ataque: ${attackType}`);
    console.log(`🌐 IP do Atacante: ${req.ip}`);
    console.log(`🔍 User-Agent: ${req.headers['user-agent']}`);
    console.log(`📍 Path: ${req.path}`);
    console.log(`⏰ Timestamp: ${attack.timestamp}`);

    // Enviar para auditoria financeira
    financialAudit.log('HONEYPOT_TRIGGERED', {
      userId: 'unknown',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      attackType,
      details,
      severity: 'CRITICAL'
    });

    // Em produção, enviar alerta imediato
    this.sendImmediateAlert(attack);
  }

  private static sendImmediateAlert(attack: any) {
    // Simulação de envio de alerta
    console.log(`🚨 ALERTA IMEDIATO ENVIADO!`);
    console.log(`📧 Email para: security@finnextho.com`);
    console.log(`📱 SMS para: +55 11 99999-9999`);
    console.log(`🔔 Slack: #security-alerts`);
    
    // Em produção, implementar:
    // - Email automático
    // - SMS via Twilio
    // - Webhook para Slack/Discord
    // - Integração com SIEM
  }

  private static startFakeServer() {
    const port = Number(process.env.HONEYPOT_PORT) || 3000;
    
    this.fakeApp.listen(port, '0.0.0.0', () => {
      console.log(`🍯 Honeypot ativo na porta ${port}`);
      console.log(`🎣 Armadilhas configuradas:`);
      console.log(`   - /.env (arquivo de configuração falso)`);
      console.log(`   - /admin (painel admin falso)`);
      console.log(`   - /api/users (API de usuários falsa)`);
      console.log(`   - /backup (backup falso)`);
      console.log(`   - /config (configuração falsa)`);
      console.log(`   - /logs (logs falsos)`);
      console.log(`   - /debug (debug falso)`);
      console.log(`   - /search (SQL injection falso)`);
      console.log(`   - /upload (upload falso)`);
      console.log(`   - /execute (execução de comando falso)`);
    });
  }

  // Métodos para análise de ataques
  static getAttackLogs() {
    return this.attackLogs;
  }

  static getAttackStats() {
    const stats = {
      total: this.attackLogs.length,
      byType: {} as any,
      byIP: {} as any,
      recent: this.attackLogs.filter(log => 
        Date.now() - new Date(log.timestamp).getTime() < 24 * 60 * 60 * 1000
      ).length
    };

    this.attackLogs.forEach(attack => {
      stats.byType[attack.attackType] = (stats.byType[attack.attackType] || 0) + 1;
      stats.byIP[attack.ip] = (stats.byIP[attack.ip] || 0) + 1;
    });

    return stats;
  }

  static blockIP(ip: string) {
    console.log(`🚫 IP ${ip} bloqueado por tentativa de ataque`);
    // Em produção, implementar bloqueio real
    // - Firewall rules
    // - WAF rules
    // - Rate limiting
  }
}

// Inicializar automaticamente
DeceptionTechnology.initialize(); 