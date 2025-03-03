"use client"
import { useState } from 'react';
import './app.css';

function Square({ value, onSquareClick }: { value: string, onSquareClick: () => void }) {
    return <button
        className="square"
        onClick={onSquareClick}
    >
        {value}
    </button>;
}
function Board({ xIsNext, squares, onPlay }: { xIsNext: boolean, squares: string[], onPlay: (squares: string[]) => void }) {
    function handleClick(i: number) {
        // 方格内容只能改变一次
        if (squares[i] || calculateWinner(squares)) {
            return;
        }
        // 保持数据的不变性：①撤销、重做->历史记录，直接复用 ②性能优化->比较数据是否变化成本低
        const nextSquares = squares.slice();
        if (xIsNext) {
            nextSquares[i] = "X";
        } else {
            nextSquares[i] = "O";
        }
        onPlay(nextSquares);
    }

    const winner = calculateWinner(squares);

    let status;
    if (winner) {
        status = "Winner: " + winner;
    } else {
        status = "Next player: " + (xIsNext ? "X" : "O");
    }

    return <>
        <div className="status">{status}</div>
        {[1, 2, 3].map((item) => {
            return <div className="board-row" key={item}>
                {[1, 2, 3].map((i) => {
                    const key = i + (item - 1) * 3 - 1;
                    return <Square onSquareClick={() => handleClick(key)} value={squares[key]} key={key} />;
                })}
            </div>
        })}
    </>;
}

export default function Game() {
    const [history, setHistory] = useState([Array(9).fill(null)]);
    const [currentMove, setCurrentMove] = useState(0); // 当前正在查看的步骤
    const currentSquares = history[currentMove];
    const xIsNext = currentMove % 2 === 0;


    function handlePlay(nextSquares: string[]) {
        const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
        setHistory(nextHistory);
        setCurrentMove(nextHistory.length - 1);
    }
    function jumpTo(nextMove: number) {
        setCurrentMove(nextMove);
    }

    const moves = history.map((squares, move) => {
        let description;
        if (move > 0) {
            description = 'Go to move #' + move;
        } else {
            description = 'Go to game start';
        }
        return (
            <li key={move}>
                <button onClick={() => jumpTo(move)}>{description}</button>
            </li>
        );
    });

    return (
        <div className="game">
            <div className="game-board">
                {/* Board 组件完全由 Game 组件传递给它的 props 控制 */}
                <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
            </div>
            <div className="game-info">
                <ol>{moves}</ol>
            </div>
        </div>
    );
}

function calculateWinner(squares: string[]) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
}