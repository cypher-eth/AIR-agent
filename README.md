# 🧠 AI Support WebApp

An interactive AI support application featuring voice interface, 3D animated avatar, and Web3 integration. Built with Next.js, Three.js, and Wagmi.

## ✨ Features

- 🎙️ **Voice Interface**: Push-to-talk functionality using Web Speech API
- 🎵 **Audio Recording**: Record and playback your voice input
- 🎯 **3D Animated Avatar**: Interactive floating sphere that responds to voice
- 🤖 **AI Integration**: Ready for n8n workflow integration
- 🔗 **Web3 Integration**: Wallet connection and smart contract interactions
- 📱 **Mobile Responsive**: Works on desktop and mobile devices
- 🎨 **Modern UI**: Beautiful gradient design with Tailwind CSS

## 🆕 Recent Improvements

### Code Cleanup & Audio Processing Enhancements

The codebase has been significantly cleaned up and improved:

- **Unified Audio Processing**: Consolidated duplicate audio handling code into a single `processWithAI` function
- **Better Error Handling**: Improved error messages and fallback mechanisms
- **Enhanced n8n Integration**: Better response text extraction with multiple fallback options
- **Cleaner Component Structure**: Removed duplicate functionality from VoiceButton component
- **Improved Response Display**: Response text is now always displayed when audio is sent to n8n
- **Better Debug Information**: Collapsible debug info panel for development
- **Streamlined UI**: Cleaner button layout and improved user experience

### Key Changes

1. **API Route (`/api/ai/voice`)**:
   - Better validation of input parameters
   - Improved response text extraction from n8n
   - Enhanced error handling and logging
   - More detailed metadata in responses

2. **Main Page Component**:
   - Unified `processWithAI` function handles both transcript and audio processing
   - Removed duplicate audio processing code
   - Better state management for processing status
   - Improved error handling with user-friendly messages

3. **VoiceButton Component**:
   - Removed duplicate play functionality (now handled in main page)
   - Simplified component structure
   - Better cleanup and memory management

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

The app is now fully integrated with n8n workflows! Here's how to set it up:

#### 1. Set Up Your N8N Workflow

1. **Install n8n** (if not already installed):
   ```bash
   npm install -g n8n
   # or
   docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
   ```

2. **Create a New Workflow**:
   - Open n8n at `http://localhost:5678`
   - Click "New Workflow"
   - Add a "Webhook" trigger node
   - Configure the webhook URL (copy this URL for your `.env.local`)

3. **Configure the Webhook Node**:
   - Set HTTP Method to `POST`
   - Set Response Mode to `Respond to Webhook`
   - The webhook will receive this JSON payload:
   ```json
   {
     "transcript": "string",
     "timestamp": "string",
     "sessionId": "string",
     "userAgent": "string",
     "audioData": "string (base64) | null"
   }
   ```

4. **Add AI Processing Nodes**:
   - **HTTP Request Node** (for OpenAI API):
     - Method: `POST`
     - URL: `https://api.openai.com/v1/chat/completions`
     - Headers: `Authorization: Bearer YOUR_OPENAI_API_KEY`
     - Body:
     ```json
     {
       "model": "gpt-3.5-turbo",
       "messages": [
         {
           "role": "system",
           "content": "You are a helpful AI assistant. Respond to user queries and ask quiz questions about geography. When the user answers correctly, respond with responseType: 'correct'."
         },
         {
           "role": "user",
           "content": "{{ $json.transcript }}"
         }
       ],
       "max_tokens": 150
     }
     ```

   - **Set Node** (to format response):
     - Set the following values:
     ```json
     {
       "responseText": "{{ $json.choices[0].message.content }}",
       "responseType": "info",
       "metadata": {
         "model": "gpt-3.5-turbo",
         "timestamp": "{{ $now }}"
       }
     }
     ```

5. **Add Response Logic**:
   - **IF Node** (to check for correct answers):
     - Condition: `{{ $json.responseText.toLowerCase().includes('correct') || $json.responseText.toLowerCase().includes('right') }}`
     - If true: Set `responseType` to `"correct"`
     - If false: Set `responseType` to `"info"`

6. **Final Response Node**:
   - Connect all nodes to a final "Respond to Webhook" node
   - Set the response body to:
   ```json
   {
     "responseText": "{{ $json.responseText }}",
     "responseType": "{{ $json.responseType }}",
     "responseAudioUrl": "{{ $json.responseAudioUrl }}",
     "metadata": "{{ $json.metadata }}"
   }
   ```

#### 2. Environment Configuration

Add the following to your `.env.local`:

```bash
# N8N Workflow URL (replace with your actual webhook URL)
N8N_WORKFLOW_URL=https://your-n8n-instance.com/webhook/your-workflow-id

# Optional: N8N API Key (if using authentication)
N8N_API_KEY=your-n8n-api-key
```

#### 3. Test Your Integration

Test the webhook with curl:

```bash
curl -X POST https://your-n8n-instance.com/webhook/your-workflow-id \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Hello, what is the capital of France?",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "sessionId": "test-session",
    "userAgent": "test-agent",
    "audioData": null
  }'
```

Expected response:
```json
{
  "responseText": "The capital of France is Paris. Would you like me to ask you a question about it?",
  "responseType": "info",
  "metadata": {
    "model": "gpt-3.5-turbo",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

The app will automatically fall back to local processing if the n8n workflow is unavailable.

#### 4. Quick Start with Import

For a quick setup, you can import the provided workflow:

1. **Import the Workflow**:
   - In n8n, go to "Workflows" → "Import from File"
   - Select the `n8n-workflow-example.json` file from this repository
   - The workflow will be imported with all nodes configured

2. **Set Environment Variables in n8n**:
   - Go to "Settings" → "Variables"
   - Add `OPENAI_API_KEY` with your OpenAI API key

3. **Activate the Workflow**:
   - Click "Activate" to make the webhook live
   - Copy the webhook URL and add it to your `.env.local`

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
