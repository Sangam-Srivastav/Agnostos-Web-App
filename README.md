# AGNOSTOS 🌐

**A secret world where anonymity reigns. Create, connect, and earn—without a trace.**

![AGNOSTOS Banner](https://img.shields.io/badge/AGNOSTOS-Anonymous%20Platform-00ff88?style=for-the-badge&logo=matrix&logoColor=white)

---

## 🚀 Overview

AGNOSTOS is a cutting-edge anonymous social platform and marketplace built with modern web technologies. It combines community building, file sharing, service trading, and secure messaging in a cyberpunk-inspired environment where privacy and anonymity are paramount.

### ⚠️ **WARNING: THERE IS NO MOVING BACK** ⚠️

Once you enter the AGNOSTOS system, you become part of an anonymous network designed for maximum privacy and security.

## ✨ Key Features

### 🏛️ **Anonymous Communities**
- Create and join private/public communities
- Role-based access control (Admin, Moderator, Member)
- Community-specific file sharing and services
- Join request system for private communities

### 💰 **AGNOS Currency System**
- Internal cryptocurrency for transactions
- Secure peer-to-peer payments
- Transaction history tracking
- Starting balance of 100 AGNOS for new users

### 🔒 **Encrypted Communications**
- Real-time WebSocket messaging
- Personal and community chats
- Message encryption and privacy
- Read receipts and message status

### 📁 **File Trading Marketplace**
- Upload and monetize digital files
- Category-based organization
- Secure file transactions
- Community-specific file sharing

### ⚙️ **Service Exchange**
- Offer professional services
- Skill-based marketplace
- Secure service payments
- Community service listings

### 🎨 **Cyberpunk Interface**
- Matrix-inspired design
- Terminal aesthetics
- Responsive mobile design
- Glassmorphism effects

## 🛠️ Technology Stack

### **Frontend**
- **HTML5** - Semantic structure
- **CSS3** - Advanced styling with CSS variables
- **Vanilla JavaScript** - Client-side logic
- **WebSocket** - Real-time communication

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database
- **WebSocket (ws)** - Real-time messaging

### **Security & Storage**
- **bcrypt** - Password hashing
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

### **UI/UX**
- **Responsive Design** - Mobile-first approach
- **Matrix Animation** - Canvas-based background
- **Glassmorphism** - Modern UI effects

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone the Repository**
```bash
git clone https://github.com/Sangam-Srivastav
cd agnostos
```

2. **Install Dependencies**
```bash
npm install
```

3. **Create Required Directories**
```bash
mkdir uploads
```

4. **Start the Server**
```bash
npm start
# or
node server.js
```

5. **Access the Application**
- Open your browser and navigate to `http://localhost:3000`
- For network access: `http://Your_IP_Address:3000`

## 🎮 Usage Guide

### **Getting Started**

1. **Registration**
   - Click "JOIN NETWORK" on the landing page
   - Provide full name, username, and secure password
   - Password must include uppercase, lowercase, numbers, and special characters

2. **Dashboard Navigation**
   - **Profile**: View stats and AGNOS balance
   - **Communities**: Create/join anonymous communities
   - **Files**: Upload and browse digital assets
   - **Services**: Offer and purchase professional services
   - **Chat**: Secure messaging system
   - **Wallet**: Manage AGNOS transactions

### **Community Features**

- **Create Communities**: Define category, privacy settings
- **Join Communities**: Public communities or request private access
- **Community Chat**: Real-time group messaging
- **File Sharing**: Community-specific file uploads
- **Service Offerings**: Provide services within communities

### **Marketplace Operations**

- **File Trading**: Upload files with pricing in AGNOS
- **Service Exchange**: List professional services
- **Secure Transactions**: Built-in payment system
- **Download Management**: Access purchased content

## 📊 Database Schema

### **Core Tables**

- `users` - User accounts and AGNOS balances
- `communities` - Community information and settings
- `community_members` - User-community relationships
- `community_requests` - Join request management
- `messages` - Chat messages (personal/community)
- `files` - File upload metadata and pricing
- `services` - Service listings and details
- `transactions` - AGNOS payment records

## 🌐 API Endpoints

### **Authentication**
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/check-username/:username` - Username availability

### **Communities**
- `GET /api/communities` - List all communities
- `POST /api/communities` - Create community
- `POST /api/communities/join` - Join community
- `GET /api/communities/user/:userId` - User's communities

### **Files**
- `POST /api/upload-file` - File upload
- `GET /api/files` - Browse files
- `GET /api/files/user/:userId` - User's files

### **Services**
- `POST /api/services` - Create service
- `GET /api/services` - Browse services
- `GET /api/services/user/:userId` - User's services

### **Messaging**
- `GET /api/chats/:userId` - User's chat list
- `GET /api/messages/:chatId/:userId` - Chat messages
- WebSocket connection for real-time messaging

### **Transactions**
- `POST /api/transactions` - Process payment
- `GET /api/transactions/:userId` - Transaction history

## 🎯 Project Structure

```
AGNOSTOS/
├── 📄 index.html          # Main HTML structure
├── 📄 app.js              # Frontend JavaScript logic
├── 📄 server.js           # Backend Express server
├── 📄 style.css           # Complete styling system
├── 📄 package.json        # Dependencies and scripts
├── 📁 uploads/            # File storage directory
├── 📄 agnostos.db         # SQLite database (auto-generated)
└── 📄 README.md           # This file
```

## 🎨 Design System

### **Color Palette**
- **Primary**: `#00ff88` (Matrix Green)
- **Secondary**: `#00ff41` (Terminal Green)
- **Background**: `#0A0F0D` (Deep Dark)
- **Surface**: Various alpha transparencies

### **Typography**
- **Headers**: Rajdhani (Cyberpunk style)
- **Body**: Roboto/System fonts
- **Code**: Roboto Mono/Consolas

### **UI Components**
- Glassmorphism cards
- Neon button effects
- Matrix rain animation
- Scanline overlays

## 🔧 Configuration

### **Server Settings**
- **Port**: 3000 (default)
- **Host**: 0.0.0.0 (all interfaces)
- **Database**: SQLite (agnostos.db)
- **File Upload**: ./uploads directory

### **Security Features**
- Password hashing with bcrypt (10 rounds)
- WebSocket authentication
- CORS protection
- Input validation and sanitization

## 📱 Mobile Responsiveness

- **Breakpoints**: 400px, 576px, 768px, 992px, 1200px
- **Mobile Menu**: Hamburger navigation
- **Touch Optimized**: Large touch targets
- **Responsive Chat**: Collapsible sidebar
- **Adaptive Layouts**: Grid systems adjust automatically

## 🚀 Performance Features

- **Lazy Loading**: Content loaded on demand
- **WebSocket Reconnection**: Automatic connection recovery
- **Efficient Database**: SQLite with optimized queries
- **CSS Variables**: Dynamic theming system
- **Modular JavaScript**: Clean separation of concerns

## 🔄 Real-time Features

- **Live Messaging**: Instant message delivery
- **Status Updates**: Online/offline indicators
- **Community Notifications**: Join request alerts
- **Transaction Confirmations**: Real-time payment updates

## 🛡️ Security Measures

- **Password Strength**: Enforced complexity requirements
- **Anonymous Architecture**: No personal data tracking
- **Secure File Handling**: Protected upload system
- **Transaction Security**: Validated AGNOS transfers

## 🤝 Contributing

We welcome contributions to the AGNOSTOS project! Here's how you can help:

### **Development Setup**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Code Style**
- Use consistent indentation (2 spaces)
- Follow JavaScript ES6+ standards
- Comment complex logic thoroughly
- Maintain the cyberpunk aesthetic

## 🐛 Known Issues & Limitations

- **File Size**: Currently limited by server memory
- **Concurrent Users**: Optimized for small-medium scale
- **Mobile Safari**: Some backdrop-filter effects may vary
- **WebSocket**: Requires modern browser support

## 🔮 Future Roadmap

### **Phase 1** (Current)
- ✅ Core platform functionality
- ✅ Anonymous communities
- ✅ File trading system
- ✅ AGNOS currency

### **Phase 2** (Planned)
- 🔄 Enhanced encryption
- 🔄 Mobile app development
- 🔄 Advanced admin tools
- 🔄 Blockchain integration

### **Phase 3** (Future)
- 🆕 AI-powered recommendations
- 🆕 Advanced analytics
- 🆕 Plugin system
- 🆕 Multi-language support

## 📞 Support & Contact

- **Issues**: GitHub Issues tab
- **Discussions**: GitHub Discussions
- **Email**: support@agnostos.system
- **Matrix Chat**: #agnostos:matrix.org

## 📋 System Requirements

### **Minimum Requirements**
- **OS**: Windows 10, macOS 10.14, Ubuntu 18.04
- **RAM**: 512MB available
- **Storage**: 100MB free space
- **Browser**: Chrome 70+, Firefox 65+, Safari 12+

### **Recommended Requirements**
- **RAM**: 2GB available
- **Storage**: 1GB free space
- **Network**: Stable internet connection for real-time features

## ⚖️ License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Matrix Digital Rain**: Inspired by the iconic Matrix effect
- **Cyberpunk Aesthetic**: Influenced by cyberpunk culture
- **Open Source Community**: Built with amazing open-source tools
- **Security First**: Privacy-focused development approach

## 📈 Statistics

- **Lines of Code**: 2000+ (Frontend + Backend)
- **Database Tables**: 8 core tables
- **API Endpoints**: 25+ RESTful endpoints
- **UI Components**: Fully responsive design system
- **Features**: 15+ major feature sets

---

## 🌟 **Ready to Enter the System?**

```bash
npm install
node server.js
# Navigate to http://localhost:3000
# Click "ENTER SYSTEM"
# ⚠️ THERE IS NO MOVING BACK ⚠️
```

**Welcome to AGNOSTOS - Where Anonymity Reigns Supreme** 🔮

---

*Last Updated: January 2024*
*Version: 1.0.0*
*Status: Active Development*
