import React, { Component } from 'react';
import styled from 'styled-components'

import {
  subscribeToShotsFired,
  sendMousePosition,
  subscribeToMousePositions,
  sendMouseClickPosition,
  sendNicknameToServer,
  subscribeToNewTarget,
  subscribeToScoreboard,
  subscribeToMyID,
  unsubscribeFromAll,
  subscribeToWinner,
  subscribeToWaitForNextRound
} from './api'

import {
  renderBulletHoles,
  renderCrosshairs,
  renderTarget
} from './Helpers/RenderFunctions';

import { LoadImage } from './Helpers/Loaders'
import { compare } from './Helpers/sorter'
import { playGunSound } from './Helpers/SoundEffects'
import Sounds from './Components/Sounds'
import NameInput, { StyledModal } from './Components/NameInput'

import crosshair from './img/crosshair_15.png'
import bullethole from './img/bullet_hole_small_2.png'
import cowboyTown from './img/cowboy_town.jpg'

const Grid = styled.div`
  height: 100vh;

  display: grid;
  align-items: center;
  justify-items: start;

  grid-template-columns: 100px ${1920 * .6 + 5}px auto;
  grid-template-rows: 1fr auto 1fr;
  grid-template-areas: ". information creator" ". gameboard scoreboard" ". settings .";
`
const Scoreboard = styled.div`
  grid-area: scoreboard;
  justify-self: start;
  align-self: start;
`
const Gameboard = styled.canvas`
  grid-area: gameboard;
  background-color: gray;
  cursor: none;
  border: 5px solid black;
  background-image: url(${cowboyTown});
  background-size: ${1920 * .6 + 5}px ${1080 * .6 + 5}px;
`
const Information = styled.div`
  grid-area: information;
  font-size: 25px;
`
const Creator = styled.div`
  grid-area: creator;
  align-self: start;
`

const Winner = props => {
  const { winner, timer } = props;
  if (winner)
    return (
      <StyledModal style={{padding: '0 10px 0 10px'}}>
        <div style={{ fontSize: '50px' }}>{winner.nickname}</div>
        <div style={{ fontSize: '30px' }}>{`is the fastest gunslinger`}</div>
        <div style={{ fontSize: '40px' }}>{`Next round in: ${Math.floor(timer / 1000)}`}</div>
      </StyledModal>
    );

  return null;
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      myID: '',
      myNickname: null,
      winner: null,
      nextRoundTimer: null,
      players: [],
      bulletHoles: [],
      haveIFiredThisRound: false,
      scoreboard: [],
      target: null,
      myCursorPos: { x: 0, y: 0 },
      sendToServer: null,
      updateFrequency: 1000 / 60,
      canvasContext: null,
      crosshairIMG: new Image(),
      bulletHoleIMG: new Image()
    }
  }

  componentDidMount() {
    // Subscribe to all server events
    subscribeToMousePositions(players => { this.setState({ players }); });
    subscribeToShotsFired(bulletHoles => { this.setState({ bulletHoles }); });
    subscribeToNewTarget(target => {
      this.setState({ target },
        () => this.setState({ haveIFiredThisRound: false }));
    })
    subscribeToScoreboard(scoreboard => { this.setState({ scoreboard }); });
    subscribeToWinner(winner => { this.setState({ winner }); });
    subscribeToWaitForNextRound(nextRoundTimer => this.setState({ nextRoundTimer }));
    subscribeToMyID(myID => { this.setState({ myID }); });

    // Load images
    LoadImage(crosshair, image => { this.setState({ crosshairIMG: image }); });
    LoadImage(bullethole, image => { this.setState({ bulletHoleIMG: image }); });

    this.setState({ canvasContext: this.canvas.getContext('2d') })

    // Set canvas to desired size
    this.canvas.width = 1920 * .6;
    this.canvas.height = 1080 * .6;
  }

  componentWillUnmount() {
    unsubscribeFromAll();
  }

  // When client clicks in the canvas
  handleMouseDown = (e) => {
    // Get exact position when mouse button is clicked
    const mPos = this.getMousePositionInCanvas(e);
    // Only send mouse clicks if client has a nickname
    if (this.state.myNickname && !this.state.haveIFiredThisRound) {
      sendMouseClickPosition(mPos);
      this.setState({ haveIFiredThisRound: true });
      playGunSound();
    }
  }

  startTrackingMousePos = () => {
    // Hook onto the 'mousemove' event and update clients mouse position    
    this.canvas.addEventListener('mousemove', this.updateMyMousePosition, false);
    // Start sending the mouse position to the server at a fixed rate
    this.setState({ sendToServer: setInterval(this.sendMousePosToServer, this.state.updateFrequency) });
    // console.log("Start tracking")
  }

  stopTrackingMousePos = () => {
    // Stop listening to the 'mousemove' event when the cursor isn't inside the canvas anymore
    this.canvas.removeEventListener('mousemove', this.updateMyMousePosition, false);
    // Stop sending mouse position to server
    this.setState({ sendToServer: clearInterval(this.state.sendToServer) });
    // console.log("Stop tracking")
  }

  updateMyMousePosition = (e) => {
    this.setState({ myCursorPos: this.getMousePositionInCanvas(e) });
  }

  getMousePositionInCanvas = (e) => {
    const { clientX, clientY } = e;
    // rect contains the canvas' size and position relative to the viewport
    var rect = this.canvas.getBoundingClientRect();

    // Calculate how much our canvas has been scaled by CSS styling
    // I'm scaling it now so scaleX = scaleY = 1. But it's good to be prepared
    var scaleX = this.canvas.width / rect.width;
    var scaleY = this.canvas.height / rect.height;

    return {
      // Subtract canvas offset from viewport in order to get mouse position relative to canvas.
      // Then multiply by scale incase canvas has been scaled.
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  sendMousePosToServer = () => {
    sendMousePosition(this.state.myCursorPos);
  }

  sendNicknameToServer = () => {
    console.log("SENDING")
    sendNicknameToServer(this.state.myNickname)
  }


  renderGraphics = () => {
    renderTarget(this.state);
    renderBulletHoles(this.state);
    renderCrosshairs(this.state);
  }

  render() {
    const { canvasContext, scoreboard } = this.state;

    if (canvasContext)
      canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderGraphics();

    return (
      <Grid>
        <Information>
          <h3>High noon online western saloon shooter bounty game V4.74</h3>
          <div style={{ fontSize: '20px' }}>
            Bounty received is based on who hits the target first.<br /> 1:st +50$.  2:nd +30$.   3:rd +20$.  Rest +10$.  Target miss: -20$<br />
            Aim carefully, you only get one shot per target. First one to receive a total bounty of 350$ or more wins the round.
          </div>
        </Information>
        <Creator>
          <h2>Created with React, Nodejs and socket.io. <br/>Get the code on <a href="https://github.com/Sandsten/ShootingRange">Github</a></h2>
        </Creator>
        <Winner winner={this.state.winner} timer={this.state.nextRoundTimer} />
        <NameInput
          onSubmit={
            name => this.setState({ myNickname: name },
              () => this.sendNicknameToServer())
          }
          myNickname={this.state.myNickname}
        />
        <Gameboard
          onMouseDown={this.handleMouseDown}
          onMouseEnter={this.startTrackingMousePos}
          onMouseLeave={this.stopTrackingMousePos}
          ref={ref => this.canvas = ref}
        />
        <Sounds />
        <Scoreboard>
          <h1 style={{ marginLeft: '20px', marginTop: 0 }}>Most wanted - First to 350$ wins</h1>
          <ol>
            {scoreboard.sort(compare).map(player => {
              return (
                <li key={player.id} style={{ fontSize: '20px' }}>
                  <span>{`${player.nickname} ${player.id === this.state.myID ? '(You)' : ''}`}</span>
                  <span style={{ marginLeft: '20px' }}>{`Bounty: ${player.score}$`}</span>
                </li>
              );
            })}
          </ol>
        </Scoreboard>
      </Grid>
    );
  }
}

export default App;