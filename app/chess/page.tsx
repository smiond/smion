'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Chess } from 'chess.js'
import { useAppContext } from '@/app/providers'
import { ChessChatbot } from '@/components/ChessChatbot'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslation } from 'react-i18next'

interface ChessPiece {
  type: string
  color: string
  position: string
}

export default function ChessGame() {
  const { showChatbot, setShowChatbot } = useAppContext()
  const { t } = useTranslation()
  const [game, setGame] = useState(new Chess())
  const [board, setBoard] = useState<ChessPiece[]>([])
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<string[]>([])
  const [gameStatus, setGameStatus] = useState<string>('')
  const [currentPlayer, setCurrentPlayer] = useState<'w' | 'b'>('b') // Visitor starts as black
  const [moveCount, setMoveCount] = useState(0)
  const [canAskQuestion, setCanAskQuestion] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [hasPlayedFirstMove, setHasPlayedFirstMove] = useState(false)
  const [questionsAskedThisMove, setQuestionsAskedThisMove] = useState(0)
  const [gameTime, setGameTime] = useState(0) // Game time in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showVictoryToast, setShowVictoryToast] = useState(false)

  // Initialize board
  useEffect(() => {
    updateBoard()
  }, [])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isTimerRunning) {
      interval = setInterval(() => {
        setGameTime(prevTime => prevTime + 1)
      }, 1000)
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isTimerRunning])

  // Check for visitor victory
  useEffect(() => {
    if (game.isCheckmate() && game.turn() === 'w') {
      // Visitor (black) wins - AI (white) is in checkmate
      setShowConfetti(true)
      setShowVictoryToast(true)
      setIsTimerRunning(false) // Stop timer
      
      // Hide confetti after 5 seconds
      setTimeout(() => {
        setShowConfetti(false)
      }, 5000)
      
      // Hide victory toast after 6 seconds
      setTimeout(() => {
        setShowVictoryToast(false)
      }, 6000)
    }
  }, [gameStatus, game])

  // Auto-play first move after 3 seconds
  useEffect(() => {
    if (!hasPlayedFirstMove) {
      const timer = setTimeout(() => {
        // Show toast
        setShowToast(true)
        
        // Auto-play first move (AI plays white, so it goes first)
        const moves = game.moves({ verbose: true })
        if (moves.length > 0) {
          const randomMove = moves[Math.floor(Math.random() * moves.length)]
          game.move(randomMove)
          setCurrentPlayer('b') // Now it's visitor's turn (black)
          setMoveCount(1)
          setHasPlayedFirstMove(true)
          setCanAskQuestion(true) // Enable question asking after first move
          setShowChatbot(true) // Show chatbot automatically
          setIsTimerRunning(true) // Start timer after AI's first move
          updateBoard()
        }
        
        // Hide toast after 4 seconds
        setTimeout(() => {
          setShowToast(false)
        }, 4000)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [hasPlayedFirstMove, game])

  const updateBoard = () => {
    const boardState = game.board()
    const pieces: ChessPiece[] = []
    
    boardState.forEach((row, rowIndex) => {
      row.forEach((piece, colIndex) => {
        if (piece) {
          pieces.push({
            type: piece.type,
            color: piece.color,
            position: String.fromCharCode(97 + colIndex) + (8 - rowIndex)
          })
        }
      })
    })
    
    setBoard(pieces)
    setGameStatus(getGameStatus())
  }

  const getGameStatus = () => {
    if (game.isCheckmate()) {
      return game.turn() === 'w' ? t('chess.black_wins') : t('chess.white_wins')
    }
    if (game.isDraw()) {
      return t('chess.draw')
    }
    if (game.isCheck()) {
      return game.turn() === 'w' ? t('chess.black_check') : t('chess.white_check')
    }
    return game.turn() === 'w' ? t('chess.black_turn') : t('chess.white_turn')
  }

  const handleSquareClick = (square: string) => {
    if (game.isGameOver()) return

    // If it's AI's turn, don't allow moves
    if (currentPlayer === 'w') return

    if (selectedSquare === square) {
      setSelectedSquare(null)
      setPossibleMoves([])
      return
    }

    if (selectedSquare) {
      // Try to make a move
      const move = game.move({
        from: selectedSquare as any,
        to: square as any,
        promotion: 'q' // Always promote to queen for simplicity
      })

      if (move) {
        setSelectedSquare(null)
        setPossibleMoves([])
        
        // Start timer on first move (before incrementing moveCount)
        if (moveCount === 0) {
          setIsTimerRunning(true)
        }
        
        setMoveCount(prev => prev + 1)
        setCurrentPlayer('w') // AI's turn (white)
        setCanAskQuestion(true)
        updateBoard()
        
        // Check if visitor won immediately after their move
        if (game.isCheckmate() && game.turn() === 'w') {
          setShowConfetti(true)
          setShowVictoryToast(true)
          setIsTimerRunning(false) // Stop timer
          
          // Hide confetti after 5 seconds
          setTimeout(() => {
            setShowConfetti(false)
          }, 5000)
          
          // Hide victory toast after 6 seconds
          setTimeout(() => {
            setShowVictoryToast(false)
          }, 6000)
          return // Don't let AI make a move if game is over
        }
        
        // AI makes a move after a short delay
        setTimeout(() => {
          makeAIMove()
        }, 1000)
      }
    } else {
      // Select a piece
      const piece = board.find(p => p.position === square)
      if (piece && piece.color === 'b') { // Visitor plays black pieces
        setSelectedSquare(square)
        const moves = game.moves({ square: square as any, verbose: true })
        setPossibleMoves(moves.map((move: any) => move.to))
      }
    }
  }

  // Piece values for evaluation
  const pieceValues = {
    'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
  }

  // Evaluate board position (positive = good for white, negative = good for black)
  const evaluatePosition = (game: Chess) => {
    let score = 0
    const board = game.board()
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece) {
          const value = pieceValues[piece.type as keyof typeof pieceValues]
          const pieceScore = piece.color === 'w' ? value : -value
          
          // Add positional bonuses
          if (piece.type === 'p') {
            // Pawn advancement bonus
            const advancement = piece.color === 'w' ? row : 7 - row
            score += piece.color === 'w' ? advancement * 0.1 : -advancement * 0.1
          } else if (piece.type === 'k') {
            // King safety - prefer center in endgame
            const centerDistance = Math.abs(col - 3.5) + Math.abs(row - 3.5)
            score += piece.color === 'w' ? -centerDistance * 0.1 : centerDistance * 0.1
          }
          
          score += pieceScore
        }
      }
    }
    
    return score
  }

  // Minimax with alpha-beta pruning
  const minimax = (game: Chess, depth: number, alpha: number, beta: number, maximizingPlayer: boolean): number => {
    if (depth === 0 || game.isGameOver()) {
      return evaluatePosition(game)
    }

    const moves = game.moves({ verbose: true })
    
    if (maximizingPlayer) {
      let maxEval = -Infinity
      for (const move of moves) {
        game.move(move)
        const evaluation = minimax(game, depth - 1, alpha, beta, false)
        game.undo()
        maxEval = Math.max(maxEval, evaluation)
        alpha = Math.max(alpha, evaluation)
        if (beta <= alpha) break
      }
      return maxEval
    } else {
      let minEval = Infinity
      for (const move of moves) {
        game.move(move)
        const evaluation = minimax(game, depth - 1, alpha, beta, true)
        game.undo()
        minEval = Math.min(minEval, evaluation)
        beta = Math.min(beta, evaluation)
        if (beta <= alpha) break
      }
      return minEval
    }
  }

  const makeAIMove = () => {
    if (game.isGameOver()) return

    const moves = game.moves({ verbose: true })
    if (moves.length === 0) return

    let bestMove = moves[0]
    let bestScore = -Infinity
    const depth = 3 // Search depth - higher = stronger but slower

    // Find the best move using minimax
    for (const move of moves) {
      game.move(move)
      const score = minimax(game, depth - 1, -Infinity, Infinity, false)
      game.undo()
      
      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
    }

    // Make the best move
    game.move(bestMove)
    
    setCurrentPlayer('b') // Visitor's turn (black)
    setCanAskQuestion(false) // Disable questions after AI move
    setQuestionsAskedThisMove(0) // Reset question count for new move
    updateBoard()
  }

  const resetGame = () => {
    setGame(new Chess())
    setSelectedSquare(null)
    setPossibleMoves([])
    setCurrentPlayer('b') // Visitor starts as black
    setMoveCount(0)
    setCanAskQuestion(false)
    setShowChatbot(false) // Hide chatbot on reset
    setHasPlayedFirstMove(false) // Reset first move flag
    setQuestionsAskedThisMove(0) // Reset question count
    setGameTime(0) // Reset game time
    setIsTimerRunning(false) // Stop timer
    setShowConfetti(false) // Hide confetti
    setShowVictoryToast(false) // Hide victory toast
    updateBoard()
  }

  const getPieceSymbol = (piece: ChessPiece) => {
    const symbols: { [key: string]: { [key: string]: string } } = {
      p: { w: '♙', b: '♟' },
      r: { w: '♖', b: '♜' },
      n: { w: '♘', b: '♞' },
      b: { w: '♗', b: '♝' },
      q: { w: '♕', b: '♛' },
      k: { w: '♔', b: '♚' }
    }
    return symbols[piece.type]?.[piece.color] || ''
  }

  const isLightSquare = (square: string) => {
    const file = square.charCodeAt(0) - 97
    const rank = parseInt(square[1]) - 1
    return (file + rank) % 2 === 0
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Language Switcher */}
      <LanguageSwitcher />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">{t('chess.title')}</h1>
          <p className="text-gray-300 mb-6">{t('chess.description')}</p>
          
          <div className="flex justify-center items-center gap-8 mb-6">
            <div className="text-white">
              <span className="text-lg font-semibold">{t('chess.status')}: </span>
              <span className="text-yellow-400">{gameStatus}</span>
            </div>
            <div className="text-white">
              <span className="text-lg font-semibold">{t('chess.moves')}: </span>
              <span className="text-blue-400">{moveCount}</span>
            </div>
            <div className="text-white">
              <span className="text-lg font-semibold">Vrijeme: </span>
              <span className="text-green-400">{formatTime(gameTime)}</span>
            </div>
            <button
              onClick={resetGame}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {t('chess.new_game')}
            </button>
          </div>
        </motion.div>

        {/* Chess Board */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="chess-board-game">
            {Array.from({ length: 8 }, (_, row) =>
              Array.from({ length: 8 }, (_, col) => {
                const square = String.fromCharCode(97 + col) + (row + 1)
                const piece = board.find(p => p.position === square)
                const isSelected = selectedSquare === square
                const isPossibleMove = possibleMoves.includes(square)
                const isLight = isLightSquare(square)

                return (
                  <div
                    key={square}
                    className={`chess-square-game ${isLight ? 'light' : 'dark'} ${
                      isSelected ? 'selected' : ''
                    } ${isPossibleMove ? 'possible-move' : ''}`}
                    onClick={() => handleSquareClick(square)}
                  >
                    {piece && (
                      <span 
                        className="piece"
                        style={{ 
                          color: piece.color === 'w' ? '#FFF' : '#3B82F6' // White pieces stay white, black pieces become blue
                        }}
                      >
                        {getPieceSymbol(piece)}
                      </span>
                    )}
                    {isPossibleMove && !piece && (
                      <div className="possible-move-indicator" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </motion.div>

        {/* Game Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-24 text-center"
        >
          <div className="glass-effect p-6 rounded-lg max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-white mb-4">{t('chess.how_to_play')}</h3>
            <div className="text-gray-300 space-y-2">
              <p>• {t('chess.instructions.0')}</p>
              <p>• {t('chess.instructions.1')}</p>
              <p>• {t('chess.instructions.2')}</p>
              <p>• {t('chess.instructions.3')}</p>
              <p>• {t('chess.instructions.4')}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chess Chatbot */}
      {showChatbot && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <ChessChatbot 
            questionCount={questionsAskedThisMove}
            maxQuestionsPerMove={1}
            totalQuestionsAsked={moveCount}
            onQuestionAsked={() => {
              setCanAskQuestion(false)
              setQuestionsAskedThisMove(prev => prev + 1)
            }}
          />
        </motion.div>
      )}

      {/* Floating Action Button */}
      {!showChatbot && canAskQuestion && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          onClick={() => setShowChatbot(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </motion.button>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg shadow-xl border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-lg">♟️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Idemo odigrati partiju šaha za Smionov CV!</h3>
                  <p className="text-sm text-blue-100">AI je odigrao prvi potez, sada je vaš red! Možete postaviti pitanje o Smionu.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory Toast */}
      <AnimatePresence>
        {showVictoryToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-lg shadow-xl border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-lg">🏆</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Bravo posjetitelju!</h3>
                  <p className="text-sm text-yellow-100">Pobijedio si Smionov AI šah! 🎉</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-40"
          >
            {Array.from({ length: 50 }, (_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'][i % 7],
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ 
                  y: -100, 
                  x: 0, 
                  rotate: 0,
                  scale: 0 
                }}
                animate={{ 
                  y: window.innerHeight + 100, 
                  x: (Math.random() - 0.5) * 200,
                  rotate: 360,
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
