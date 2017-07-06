/**
 * Created by reggiecole on 5/13/17.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import PouchDB from 'pouchDB';

// Define a Square on the board
function Square(props) {
    return (
        <button className="square" onClick={props.onClick}>
            {props.value}
        </button>
    );
}

function PastWinner(pastWinner) {
    return (
        <li><
            span>{pastWinner.id}</span>
            <span>{pastWinner.player}</span>
        </li>
    );
}

// Define the Board
class Board extends React.Component {
    renderSquare(i) {
        return (
            <Square
                value={this.props.squares[i]}
                onClick={() => this.props.onClick(i)}
            />
        );
    }

    render() {
        return (
            <div>
                <div className="board-row">
                    {this.renderSquare(0)}
                    {this.renderSquare(1)}
                    {this.renderSquare(2)}
                </div>
                <div className="board-row">
                    {this.renderSquare(3)}
                    {this.renderSquare(4)}
                    {this.renderSquare(5)}
                </div>
                <div className="board-row">
                    {this.renderSquare(6)}
                    {this.renderSquare(7)}
                    {this.renderSquare(8)}
                </div>
            </div>
        );
    }
}

function reloadWinners(winners , db) {
    winners = db.allDocs({include_docs: true, descending: true}, function(err, doc) {
        return doc.rows;
        console.log('Successfully got all winners!');
    });
}



// The Game will keep track of who's turn it is and the history of moves made.
class Game extends React.Component {

    renderPastWinner(pastWinner) {
    return (
        <PastWinner pastWinner={pastWinner}>
        </PastWinner>
    );
}

    constructor() {
        super();
        this.state = {
            history: [
                {
                    squares: Array(9).fill(null)
                }
            ],
            db: new PouchDB('app/db/data'),
            pastWinners:  [] ,
            stepNumber: 0,
            xIsNext: true
        };
    }


    loadWinners() {
         this.state.db.allDocs({include_docs: true, descending: true}, function(err, doc) {
            return doc.rows;
            console.log('Successfully got all winners!');
        });
    }

    handleMoveForComputer() {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();
        const moveForComputer = computerMove(squares);
        if (calculateWinner(squares) || squares[moveForComputer]) {
            return;
        }
        squares[moveForComputer] =  "O";
        this.setState({
            history: history.concat([
                {
                    squares: squares
                }
            ]),
            stepNumber: history.length,
            xIsNext: !this.state.xIsNext
        });

    }

    handleClick(i) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();
        if (calculateWinner(squares) || squares[i]) {
            return;
        }
        squares[i] =  "X";
        this.setState({
            history: history.concat([
                {
                    squares: squares
                }
            ]),
            stepNumber: history.length,
            xIsNext: !this.state.xIsNext
        });
    }

    jumpTo(step) {
        this.setState({
            stepNumber: step,
            xIsNext: (step % 2) === 0
        });
    }

    componentDidUpdate() {
        if(!this.state.xIsNext){
            this.handleMoveForComputer();
        }
        const winners = this.state.pastWinners;
        const db =  this.state.db;
        this.state.db.changes({
            since: 'now',
            live: true
        }).on('change', function () {
            reloadWinners(winners, db);
        });
    }

    componentDidMount() {
        this.state.pastWinners = this.loadWinners();
    }


    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const winner = calculateWinner(current.squares);

        const moves = history.map((step, move) => {
            const desc = move ? "Move #" + move : "Game start";
            return (
                <li key={move}>
                    <a href="#" onClick={() => this.jumpTo(move)}>{desc}</a>
                </li>
            );
        });

        let status;
        if (winner) {
            status = "Winner: " + winner;
            var winningPlayer = {
                _id: new Date().toISOString(),
                player: winner
            };
            this.state.db.put(winningPlayer, function callback(err, result) {
                if (!err) {
                    console.log('Successfully posted a winner!');
                }
            });
        } else {
            status = "Next player: " + (this.state.xIsNext ? "X" : "O");
        }


        const pastFolks = this.state.pastWinners;


        return (
            <div className="game">
                <div className="game-board panel panel-default">
                    <Board
                        squares={current.squares}
                        onClick={i => this.handleClick(i)}
                    />
                </div>
                <div className="well well-lg game-info-well">
                        <div className="game-info">
                            <div>{status}</div>
                            <ol>{moves}</ol>
                        </div>
                </div>
                <div className="well well-lg game-info-well">
                    <div>Past Winners!</div>
                    <ol>{pastFolks}</ol>
                </div>

            </div>
        );
    }
}

// ========================================

ReactDOM.render(<Game />, document.getElementById("root"));

function calculateWinner(squares) {
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

function probableSpace(square) {
    return square === null;
}

function computerMove(squares) {
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

    // First See if Computer has a winning move to make
    for (let i = 0 ; i < lines.length; i++) {
        const [a, b, c] = lines[i];

        if (squares[a] ==='O' && (squares[b] === 'O') && probableSpace(squares[c])) {
            console.log("computer going for win");
            return c;
        } else if (probableSpace(squares[a]) && (squares[b]==='O') && (squares[c] === 'O')) {
            console.log("computer going for win");

            return a;
        } else if (squares[a] ==='O' && probableSpace(squares[b]) && (squares[c] === 'O')) {
            console.log("computer going for win");

            return b;
        }
    }

    // If not Then prevent player from winning next turn
    for (let i = 0 ; i < lines.length; i++) {
        const [a, b, c] = lines[i];
         if (squares[a] ==='X' && squares[b] === 'X' && probableSpace(squares[c])) {
            console.log("computer preventing defeat: ");

            return c;
        } else if (probableSpace(squares[a]) && squares[b]==='X' && squares[c] === 'X') {
            console.log("computer preventing defeat");

            return a;
        } else if (squares[a] ==='X' && probableSpace(squares[b]) && squares[c] === 'X') {
            console.log("computer preventing defeat");

            return b;
        }
    }

    // If not in jeopardy of losing then play a spot to get closer to winning
    for (let i = 0 ; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] ==='O' && probableSpace(squares[b]) && probableSpace(squares[c])) {
            console.log("computer making moves c:"+c);
            return c;
        } else if (probableSpace(squares[a]) && (squares[b]==='O') && probableSpace(squares[c])) {
            console.log("computer making moves a: "+a);

            return a;
        } else if (probableSpace(squares[a]) && probableSpace(squares[b]) && (squares[c] === 'O')) {
            console.log("computer making moves a: "+a);

            return a;
        } else  if (probableSpace(squares[a]) && probableSpace(squares[b]) && probableSpace(squares[c])) {
            console.log("computer making moves b:"+b);
            return b;
        }
    }

    // if nothing is open then find nearest available
    for (let i = 0 ; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (probableSpace(squares[a])) {
            console.log("computer stalling moves c:"+a);
            return a;
        } else if (probableSpace(squares[b])) {
            console.log("computer stalling moves a: "+b);

            return b;
        } else if (probableSpace(squares[c]) ) {
            console.log("computer stalling move: "+c);
            return c;
        }
    }

    return null;
}

