import React, { Component } from 'react';

import {
  subscribeToShotsFired,
  sendMousePosition,
  subscribeToMousePositions,
  sendMouseClickPosition,
  subscribeToNewTarget,
  subscribeToScoreboard,
  subscribeToMyID
} from './api'

import {
  renderBulletHoles,
  renderCrosshairs,
  renderTarget
} from './RenderFunctions';

import { LoadImage } from './Loaders'

import crosshair from './img/crosshair_15.png'
import bullethole from './img/bullet_hole_small_2.png'

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      myID: '',
      players: [],
      bulletHoles: [],
      scoreboard: [],
      target: null,
      myCursorPos: { x: 0, y: 0 },
      sendToServer: null,
      updateFrequency: 1000 / 120,
      canvasContext: null,
      crosshairIMG: new Image(),
      bulletHoleIMG: new Image()
    }
  }

  componentDidMount() {
    // Subscribe to all server events
    subscribeToMousePositions(players => { this.setState({ players }); });
    subscribeToShotsFired(bulletHoles => { this.setState({ bulletHoles }) });
    subscribeToNewTarget(target => { this.setState({ target }); })
    subscribeToScoreboard(scoreboard => { this.setState({ scoreboard }); })
    subscribeToMyID(myID => { this.setState({ myID }); })

    // Load images
    LoadImage(crosshair, image => { this.setState({ crosshairIMG: image }) });
    LoadImage(bullethole, image => { this.setState({ bulletHoleIMG: image }); });

    this.setState({ canvasContext: this.canvas.getContext('2d') })

    // Set canvas to desired size
    this.canvas.width = 1920 * .6;
    this.canvas.height = 1080 * .6;
  }

  // When client clicks in the canvas
  handleMouseDown = (e) => {
    // Get exact position when mouse button is clicked
    const mPos = this.getMousePositionInCanvas(e);
    sendMouseClickPosition(mPos);
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
      <>
        <canvas
          style={{
            backgroundColor: 'gray',
            cursor: 'none'
          }}
          onMouseDown={this.handleMouseDown}
          onMouseEnter={this.startTrackingMousePos}
          onMouseLeave={this.stopTrackingMousePos}
          ref={ref => this.canvas = ref}
        />
        <input type="text" name="" id="" style={{ position: "fixed" }} />
        <ol>
          {scoreboard.map(score => {
            return (
              <li key={score}>
                {`Player ID: ${score} ${score === this.state.myID ? '<--- You' : ''}`}
              </li>
            );
          })}
        </ol>
      </>
    );
  }
}

export default App;