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
import { LoadImage } from './Loaders'

import crosshair from './img/crosshair_15.png'
import bullethole from './img/bullet_hole_small.png'

const Circles = ({ players }) => {
  return players.map((player, i) => {
    if (!player.position) return null;
    const { x, y } = player.position;
    return <circle
      key={i}
      cx={x}
      cy={y}
      r="40"
      stroke="green"
      strokeWidth="4"
      fill="yellow"
    />
  })
}

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
    subscribeToMousePositions(players => {
      this.setState({ players });
    });

    subscribeToShotsFired(bulletHoles => {
      this.setState({ bulletHoles })
    });

    subscribeToNewTarget(target => {
      this.setState({ target });
    })

    subscribeToScoreboard(scoreboard => {
      this.setState({ scoreboard });
    })

    subscribeToMyID(myID => {
      this.setState({myID});
    })

    this.setState({ canvasContext: this.canvas.getContext('2d') })

    LoadImage(crosshair, image => {
      this.setState({ crosshairIMG: image })
    })

    LoadImage(bullethole, image => {
      this.setState({ bulletHoleIMG: image });
    })

    if (this.canvas) {
      this.canvas.width = 1920 * .6;
      this.canvas.height = 1080 * .6;
    }
  }

  handleMouseDown = (e) => {
    const mPos = this.getMousePosition(e);
    sendMouseClickPosition(mPos);
  }

  startTrackingMousePos = () => {
    console.log("Start tracking")
    this.canvas.addEventListener('mousemove', this.updateMyMousePosition, false);

    this.setState({
      sendToServer: setInterval(this.sendMousePosToServer, this.state.updateFrequency)
    })
  }

  stopTrackingMousePos = () => {
    console.log("Stop tracking")
    this.canvas.removeEventListener('mousemove', this.updateMyMousePosition, false);

    this.setState({
      sendToServer: clearInterval(this.state.sendToServer)
    })
  }

  getMousePosition = (e) => {
    const { clientX, clientY } = e;
    var rect = this.canvas.getBoundingClientRect();

    var scaleX = this.canvas.width / rect.width;
    var scaleY = this.canvas.height / rect.height;
    scaleX = scaleY = 1;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  updateMyMousePosition = (e) => {
    this.setState({
      myCursorPos: this.getMousePosition(e)
    })
  }

  sendMousePosToServer = () => {
    sendMousePosition(this.state.myCursorPos);
  }

  renderCrosshairs = () => {
    const { players, crosshairIMG, canvasContext } = this.state;
    const { width, height } = crosshairIMG;

    players.map((player, i) => {
      if (!player.position) return null;
      const { x, y } = player.position;
      canvasContext.drawImage(crosshairIMG, x - width / 2, y - height / 2);
    })
  }

  renderBulletHoles = () => {
    const { bulletHoles, canvasContext, bulletHoleIMG } = this.state;
    const { width, height } = bulletHoleIMG;

    bulletHoles.map((bulletHole, i) => {
      const { x, y } = bulletHole.position;
      canvasContext.drawImage(bulletHoleIMG, x - width / 2, y - height / 2);
    })
  }

  renderTarget = () => {
    const { canvasContext, target } = this.state;

    if (target && canvasContext) {
      const { position, radius } = target;
      canvasContext.fillStyle = '#FF0000';
      canvasContext.beginPath();
      canvasContext.arc(position.x, position.y, radius, 0, 2 * Math.PI);
      canvasContext.stroke();
      canvasContext.fill();
    }
  }

  render() {
    const { canvasContext, scoreboard } = this.state;

    if (canvasContext)
      canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderTarget();
    this.renderBulletHoles();
    this.renderCrosshairs();

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

        <ol>
          {scoreboard.map(score => {
            return <li>{`Player ID: ${score} ${score === this.state.myID ? '<--- You' : ''}`}</li>
          })}
        </ol>
      </>
    );
  }
}

export default App;
