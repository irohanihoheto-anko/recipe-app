'use client';

import { useState, useEffect, useRef } from 'react';
import { UnifiedRecipe } from '../types/recipe';

interface RecipeAssistantProps {
    recipe: UnifiedRecipe;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function RecipeAssistant({ recipe }: RecipeAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const recognitionRef = useRef<any>(null);

    // 初期化：音声認識のセットアップ
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = 'ja-JP';
                recognition.continuous = false;
                recognition.interimResults = false;

                recognition.onresult = (event: any) => {
                    const text = event.results[0][0].transcript;
                    handleUserMessage(text);
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    // チャットを開始する
    const startChat = async () => {
        setIsOpen(true);

        // まだ履歴がない場合のみ挨拶をリクエスト
        if (messages.length === 0) {
            // APIを呼ばずにローカルで即答する（通信節約）
            const greeting = 'こんにちは！このレシピについて何でも聞いてください。';
            setMessages([{ role: 'assistant', content: greeting }]);
            speakText(greeting);
        }
    };

    // 音声入力を開始
    const startListening = () => {
        if (recognitionRef.current && !isListening && !isProcessing && !isPlaying) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (error) {
                console.error('Speech recognition error:', error);
                setIsListening(false);
            }
        }
    };

    // ユーザーのメッセージを処理
    const handleUserMessage = async (text: string) => {
        const newMessages = [...messages, { role: 'user' as const, content: text }];
        setMessages(newMessages);
        await sendMessageToApi(newMessages);
    };

    // APIにメッセージ送信 & 音声再生
    const sendMessageToApi = async (currentMessages: Message[], triggerText?: string) => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: triggerText ? [...currentMessages, { role: 'user', content: triggerText }] : currentMessages,
                    recipe
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error: ${response.status} ${response.statusText}`, errorText);
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            // アシスタントのメッセージを追加
            setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);

            // ブラウザ読み上げ実行
            if (data.content) {
                speakText(data.content);
            }

        } catch (error: any) {
            console.error('Chat error:', error);

            // エラーメッセージからステータスコードを抽出して分岐
            const errorMessage = error.message || '';

            if (errorMessage.includes('429')) {
                alert('⚠️ OpenAIの利用上限（レート制限/クォータ不足）に達しました。\nしばらく時間をおいてから試すか、OpenAIのプランをご確認ください。');
            } else if (errorMessage.includes('401')) {
                alert('⚠️ APIキーが無効です。.env.localの設定を確認してください。');
            } else {
                alert(`エラーが発生しました: ${errorMessage}\nもう一度お試しください。`);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    // ブラウザ標準の音声合成で読み上げ
    const speakText = (text: string) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            // 既存の読み上げをキャンセル
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ja-JP';
            utterance.rate = 1.3; // 1.3倍速
            utterance.pitch = 1.0;

            utterance.onstart = () => setIsPlaying(true);
            utterance.onend = () => setIsPlaying(false);
            utterance.onerror = (e) => {
                console.error('TTS Error:', e);
                setIsPlaying(false);
            };

            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <>
            {/* チャット画面 (オーバーレイ) */}
            {/* チャット画面 (上部固定パネル) */}
            {isOpen && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-xl border-b border-orange-200 h-[40vh] flex flex-col transition-all">
                    {/* ヘッダー */}
                    <div className="bg-orange-500 p-3 text-white flex justify-between items-center shadow-md">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">👨‍🍳</span>
                            <h3 className="font-bold text-base">AIアシスタント</h3>
                        </div>
                        <button onClick={() => { setIsOpen(false); window.speechSynthesis.cancel(); }} className="text-white bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 text-xs font-bold transition-colors">
                            閉じる
                        </button>
                    </div>

                    {/* チャットエリア */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/90">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[85%] p-2 px-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-orange-500 text-white rounded-tr-none'
                                        : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isProcessing && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 text-gray-400 p-2 rounded-2xl rounded-tl-none text-xs animate-pulse">
                                    書き込み中... ✏️
                                </div>
                            </div>
                        )}
                        {/* 最後のメッセージが見えるようにスクロール用ダミー */}
                        <div className="h-1" />
                    </div>

                    {/* コントロールエリア (コンパクト) */}
                    <div className="p-2 bg-white border-t border-gray-100 flex items-center justify-between gap-4">
                        <p className="text-xs text-gray-400 pl-2">
                            {isListening ? '聞き取り中...' : isProcessing ? '考え中...' : isPlaying ? '再生中...' : '会話できます'}
                        </p>

                        <button
                            onClick={startListening}
                            disabled={isListening || isProcessing || isPlaying}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${isListening
                                ? 'bg-red-500 animate-pulse'
                                : isProcessing || isPlaying
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-orange-500 hover:bg-orange-600'
                                }`}
                        >
                            <span className="text-xl text-white">
                                {isListening ? '🎤' : isProcessing ? '💭' : isPlaying ? '🔊' : '🎙️'}
                            </span>
                        </button>
                    </div>
                </div>
            )}


            {/* 常時表示のスタート/終了ボタン */}
            <button
                onClick={isOpen ? () => { setIsOpen(false); window.speechSynthesis.cancel(); } : startChat}
                className={`fixed bottom-16 right-5 z-[60] text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2 ${isOpen
                    ? 'bg-gray-600 hover:bg-gray-700'
                    : 'bg-gradient-to-r from-orange-500 to-red-600'
                    }`}
            >
                <span className="text-lg">{isOpen ? '✕' : '👨‍🍳'}</span>
                <span className="text-sm font-bold">{isOpen ? '終了する' : 'アシスタントと作る'}</span>
            </button>
        </>
    );
}
