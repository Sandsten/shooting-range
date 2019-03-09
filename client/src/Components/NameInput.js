import React from 'react'
import styled from 'styled-components'

const StyledModal = styled.div`
    grid-area: gameboard;
    z-index: 1000;

    align-self: center;
    justify-self: center;

    width: 500px;
    height: 300px;
    background-color: white;
    box-shadow: 6px 6px 5px 2px rgba(0,0,0,0.75);

    display: grid;
    align-items: center;
    justify-items: center;

    grid-template-rows: 100px 1fr;
`

const StyledInput = styled.input`
  border: none;
  border-bottom: 2px solid black;
  font-size: 25px;
  text-align: center;
`

class NameInput extends React.Component {

  submitForm = e => {
    e.preventDefault();
    var nickname = e.target.firstChild.value;
    e.target.firstChild.value = "";
    // console.log(e.target.firstChild.value);
    this.props.onSubmit(nickname);

  }

  render() {
    const { myNickname } = this.props;

    if(!myNickname)
      return (
        <StyledModal>
          <div>Enter a nickname and press enter</div>
          <form onSubmit={this.submitForm}>
            <StyledInput type="text" name="" id="" autoFocus />
          </form>
        </StyledModal>
      );
    
    return null;
  }
}

export default NameInput;