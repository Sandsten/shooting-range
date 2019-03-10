import React from 'react'
import styled from 'styled-components'

import { setSoundEffectsVolume } from '../Helpers/SoundEffects'

import westernSong from '../Sound/bensound-countryboy.mp3'

const PlayPause = styled.div`
  grid-area: settings;
  align-self: start;
  font-size: 20px;
  
  display: grid;
  grid-template-columns: auto 1fr;
  /* grid-auto-rows: 1fr; */
`

const SoundCredit = styled.a`
  grid-area: settings;
  align-self: start;
  justify-self: end;
`

class Sounds extends React.Component {

  state = {
    playBackground: true,
  }

  backgroundSong = new Audio(westernSong);

  componentDidMount() {
    this.backgroundSong.volume = 0.5;
    if (this.state.playBackground)
      this.backgroundSong.play();
  }

  togglePlay = () => {
    this.setState({ playBackground: !this.state.playBackground }, () => {
      this.state.playBackground ? this.backgroundSong.play() : this.backgroundSong.pause();
    })
  }

  changeVolume = e => {
    const volume = e.target.value / 100;
    this.backgroundSong.volume = volume;
    setSoundEffectsVolume(volume);
  }

  render() {
    return (
      <>
        <PlayPause >
          <button onClick={this.togglePlay}> Play/Pause </button>
          <input style={{paddingTop: "10px"}} type="range" min="0" max="100" onChange={this.changeVolume}></input>
        </PlayPause>
        <SoundCredit href="https://www.bensound.com/royalty-free-Sounds/track/country-boy">
          Royalty Free Music from Bensound
        </SoundCredit>
      </>
    );
  }
}

export default Sounds;