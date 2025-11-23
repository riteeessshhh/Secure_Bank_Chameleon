import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Check, Copy } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api';

const MerkleBox = () => {
    const [merkleData, setMerkleData] = useState({ merkleRoot: null, count: 0, batchId: '', updatedAt: '' });
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [showFull, setShowFull] = useState(false);

    const fetchMerkleRoot = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/merkle`);
            console.log('Merkle API Response:', response.data);
            setMerkleData(response.data);
        } catch (error) {
            console.error('Error fetching Merkle root:', error);
            console.error('Error details:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMerkleRoot();
        // Refresh every 5 seconds
        const interval = setInterval(fetchMerkleRoot, 5000);
        return () => clearInterval(interval);
    }, []);

    const copyToClipboard = async () => {
        if (merkleData.merkleRoot) {
            try {
                await navigator.clipboard.writeText(merkleData.merkleRoot);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (error) {
                console.error('Failed to copy:', error);
            }
        }
    };

    const truncateHash = (hash) => {
        if (!hash) return 'No logs yet';
        if (hash.length <= 16) return hash;
        return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
    };

    return (
        <div className="bg-gray-800 dark:bg-gray-800 light:bg-white p-4 rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300 shadow-lg">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500 dark:text-green-500 light:text-green-600" />
                    <h3 className="text-sm font-bold text-gray-300 dark:text-gray-300 light:text-gray-700">
                        Tamper-Evidence Root
                    </h3>
                </div>
                <button
                    onClick={fetchMerkleRoot}
                    disabled={loading}
                    className="p-1.5 rounded hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-200 transition-colors disabled:opacity-50"
                    title="Refresh Merkle root"
                >
                    <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {merkleData.merkleRoot && merkleData.merkleRoot !== null && merkleData.merkleRoot !== "" ? (
                <>
                    <div className="bg-gray-900 dark:bg-gray-900 light:bg-gray-100 p-3 rounded border border-gray-700 dark:border-gray-700 light:border-gray-300 mb-2">
                        <div className="flex items-center justify-between gap-2">
                            <code className="text-xs font-mono text-green-400 dark:text-green-400 light:text-green-600 break-all flex-1">
                                {showFull ? merkleData.merkleRoot : truncateHash(merkleData.merkleRoot)}
                            </code>
                            <button
                                onClick={copyToClipboard}
                                className="p-1.5 rounded hover:bg-gray-800 dark:hover:bg-gray-800 light:hover:bg-gray-200 transition-colors flex-shrink-0"
                                title="Copy to clipboard"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                    <Copy className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                        {merkleData.merkleRoot.length > 16 && (
                            <button
                                onClick={() => setShowFull(!showFull)}
                                className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                            >
                                {showFull ? 'Show less' : 'Show full hash'}
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">
                        <span>Events included: <strong className="text-white dark:text-white light:text-gray-900">{merkleData.count}</strong></span>
                        <span className="text-xs">{merkleData.batchId}</span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-700 dark:border-gray-700 light:border-gray-300">
                        <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 italic">
                            Merkle root is computed over SHA-256(event JSON) for each recorded attack; 
                            any log modification will change the root.
                        </p>
                    </div>
                </>
            ) : (
                <div className="text-center py-4">
                    <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">
                        No logs yet
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-1">
                        Merkle root will appear after first attack is logged
                    </p>
                </div>
            )}
        </div>
    );
};

export default MerkleBox;

