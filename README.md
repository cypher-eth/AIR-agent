# 🧠 AI Support WebApp

An interactive AI support application featuring voice interface, 3D animated avatar, and Web3 integration. Built with Next.js, Three.js, and Wagmi.

## ✨ Features

- 🎙️ **Voice Interface**: Push-to-talk functionality using Web Speech API
- 🎯 **3D Animated Avatar**: Interactive floating sphere that responds to voice
- 🤖 **AI Integration**: Ready for n8n workflow integration
- 🔗 **Web3 Integration**: Wallet connection and smart contract interactions
- 📱 **Mobile Responsive**: Works on desktop and mobile devices
- 🎨 **Modern UI**: Beautiful gradient design with Tailwind CSS

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Web3 wallet (MetaMask, WalletConnect, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AIR-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your configuration:
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - `N8N_WORKFLOW_URL`: Your n8n workflow endpoint
   - Other optional variables as needed

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 Usage

### Voice Interaction

1. **Hold to Talk**: Press and hold the microphone button to start recording
2. **Release to Send**: Release the button to send your voice input to the AI
3. **Listen to Response**: The AI will respond with synthesized speech
4. **Watch the Avatar**: The 3D sphere animates based on speaking activity

### Getting Rewards

1. **Answer Questions**: The AI will ask quiz questions
2. **Provide Correct Answers**: When you answer correctly, a congratulations modal appears
3. **Connect Wallet**: Click "Connect Wallet" to link your Web3 wallet
4. **Claim Rewards**: Click "Claim Reward" to execute the smart contract transaction

## 🔧 Technical Architecture

### Components

- **`Sphere`**: 3D animated avatar using Three.js and React Three Fiber
- **`VoiceButton`**: Web Speech API integration for voice input
- **`Modal`**: Congratulations modal with Web3 integration
- **`WagmiProvider`**: Web3 configuration and wallet management

### API Routes

- **`/api/ai/voice`**: Processes voice transcripts and returns AI responses

### Libraries Used

- **Next.js 14**: React framework with App Router
- **Three.js**: 3D graphics and animations
- **Wagmi**: Ethereum interactions
- **Tailwind CSS**: Styling
- **Web Speech API**: Voice recognition and synthesis

## 🛠️ Configuration

### n8n Integration

Replace the mock API logic in `app/api/ai/voice/route.ts` with your actual n8n workflow:

```typescript
const response = await fetch(process.env.N8N_WORKFLOW_URL!, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ transcript })
});
```

### Smart Contract Integration

Update the contract address and ABI in `components/Modal.tsx`:

```typescript
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const abi = [/* Your contract ABI */];
```

## 🌐 Browser Support

- **Chrome**: Full support (recommended)
- **Safari**: Full support
- **Firefox**: Limited Web Speech API support
- **Edge**: Full support

## 📱 Mobile Support

The app is fully responsive and works on mobile devices. Touch events are supported for the push-to-talk functionality.

## 🎨 Customization

### Styling

- Colors and animations can be customized in `tailwind.config.js`
- Global styles are in `app/globals.css`

### 3D Avatar

- Sphere animations and materials can be modified in `components/Sphere.tsx`
- Additional 3D models can be added using React Three Fiber

### Voice Settings

- Speech recognition and synthesis settings can be adjusted in `lib/audio.ts`
- Voice selection and audio parameters are configurable

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Security Notes

- Environment variables are properly configured for client/server separation
- Web3 transactions require user approval
- Speech API only works over HTTPS in production

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check the [Issues](https://github.com/your-repo/issues) section
- Create a new issue with detailed information
- Include browser console errors if applicable

## 🔮 Future Enhancements

- [ ] Multi-language support
- [ ] Voice cloning integration
- [ ] Advanced 3D animations
- [ ] Real-time collaboration features
- [ ] Analytics and usage tracking
