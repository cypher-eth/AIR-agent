'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAccount, useConnect, useDisconnect, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
}

export function Modal({ isOpen, onClose, title, subtitle }: ModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isTransacting, setIsTransacting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract } = useWriteContract();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
      setTransactionStatus('idle');
      setTransactionHash('');
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleClaimReward = async () => {
    if (!isConnected) {
      // Connect wallet first
      const connector = connectors[0]; // Use first available connector
      if (connector) {
        connect({ connector });
      }
      return;
    }

    setIsTransacting(true);
    setTransactionStatus('pending');

    try {
      // Example contract interaction
      // Replace with your actual contract address and ABI
      const contractAddress = '0x1234567890123456789012345678901234567890'; // Replace with your contract
      
      // Simple contract call example
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: [
          {
            name: 'claimReward',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [],
            outputs: [],
          },
        ],
        functionName: 'claimReward',
        args: [],
      });

      setTransactionStatus('success');
      setTransactionHash('0x1234...'); // This would be the actual transaction hash
    } catch (error) {
      console.error('Transaction failed:', error);
      setTransactionStatus('error');
    } finally {
      setIsTransacting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`
        relative w-full max-w-md bg-gradient-to-br from-slate-800 to-slate-900 
        rounded-2xl p-6 border border-white/10 shadow-2xl
        transition-all duration-300 transform
        ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      `}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-gray-300">{subtitle}</p>
          </div>

          {/* Wallet Connection Status */}
          {isConnected ? (
            <div className="space-y-2">
              <p className="text-sm text-green-400">
                ✅ Wallet Connected
              </p>
              <p className="text-xs text-gray-400 font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-yellow-400">
                🔐 Wallet Not Connected
              </p>
              <p className="text-xs text-gray-400">
                Connect your wallet to claim rewards
              </p>
            </div>
          )}

          {/* Transaction Status */}
          {transactionStatus === 'pending' && (
            <div className="space-y-2">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-blue-400">Transaction pending...</p>
            </div>
          )}

          {transactionStatus === 'success' && (
            <div className="space-y-2">
              <p className="text-sm text-green-400">✅ Transaction successful!</p>
              <p className="text-xs text-gray-400 font-mono">
                Hash: {transactionHash}
              </p>
            </div>
          )}

          {transactionStatus === 'error' && (
            <div className="space-y-2">
              <p className="text-sm text-red-400">❌ Transaction failed</p>
              <p className="text-xs text-gray-400">
                Please try again or check your wallet
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 button-secondary"
              disabled={isTransacting}
            >
              Close
            </button>
            
            <button
              onClick={handleClaimReward}
              className="flex-1 button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isTransacting || transactionStatus === 'success'}
            >
              {!isConnected ? 'Connect Wallet' : 
               transactionStatus === 'success' ? 'Claimed!' :
               isTransacting ? 'Processing...' : 'Claim Reward'}
            </button>
          </div>

          {/* Disconnect button for connected wallets */}
          {isConnected && (
            <button
              onClick={() => disconnect()}
              className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
            >
              Disconnect Wallet
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 