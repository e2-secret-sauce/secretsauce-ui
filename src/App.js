import React, { Component } from 'react';
import './App.css';
import logo from './I-love-secret-sauce.jpg';
import CSVToArray from './csv';
import sjcl from 'sjcl';

function FileUpload(props) {

  // Needed to cater for an empty line at the end if any.
  const removeLastEmptyLines = (contents) => {
    contents = contents.slice();
    while(contents[contents.length - 1].length === 1) {
      contents = contents.slice(0, contents.length - 1);
    }
    return contents;
  };

  const handleFileUpload = (ev) => {
    const file = ev.target.files[0];
    const reader = new FileReader();
    reader.onload = (file) => {
      const data = CSVToArray(reader.result);
      const headers = data[0].map(h => { return {text: h, protected: false}; });
      const contents = data.slice(1, data.length);
      props.onUpload({headers: headers, contents: removeLastEmptyLines(contents)});
    }
    reader.readAsText(file);
  };

  return (
    <div style={{textAlign: 'center'}}>
      <img src={logo} alt="logo" />
      <div className="input-group">
        <div className="input-group-prepend">
          <span className="input-group-text" id="inputGroupFileAddon01">Upload</span>
        </div>
        <div className="custom-file">
          <input type="file" className="custom-file-input" accept=".csv" id="inputGroupFile01" aria-describedby="inputGroupFileAddon01" onChange={handleFileUpload} />
          <label className="custom-file-label" htmlFor="inputGroupFile01">Choose a CSV file</label>
        </div>
      </div>
    </div>
  );

}

function ColumnSelection(props) {

  const headers = props.data.headers;
  const dataElements = headers.map((x, i) => {
    return (
      <tr key={i}>
        <td>{x.text}</td>
        <td>String</td>
        <td><input type="checkbox" defaultChecked={headers[i].protect} onClick={() => props.onSetProtect(i)} /></td>
      </tr>
    );
  });

  return (
    <div>
    <table className="table">
      <thead>
        <tr>
          <th>Field</th>
          <th>Type</th>
          <th>Protect</th>
        </tr>
      </thead>
      <tbody>
        {dataElements}
      </tbody>
    </table>
    <button type="button" className="btn btn-secondary" onClick={() => props.onSetStep('FileUpload')}>Back</button>
    &nbsp;
    <button type="button" className="btn btn-primary" onClick={props.onProtect}>Protect</button>
    </div>
  );

}


function ProtectedData(props) {

  const headers = props.protectedData.headers.map((x, i) => {
    return (
      <th key={i}>{x}</th>
    );
  });

  const contents = props.protectedData.contents.map((x, i) => {

    const row = x.map((y, j) => {
      return <td key={j}>{y}</td>
    });

    return (
      <tr key={i}>
        {row}
      </tr>
    );
  });

  return (
    <div>
      <table className="table">
        <thead>
          <tr>
            {headers}
          </tr>
        </thead>
        <tbody>
          {contents}
        </tbody>
      </table>
      <button type="button" className="btn btn-secondary" onClick={() => props.onSetStep('ColumnSelection')}>Back</button>
      &nbsp;
      <button type="button" className="btn btn-primary" onClick={() => alert("Not implementet yet!")}>Publish</button>
    </div>
  );

}

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      step: 'FileUpload',
    };
  }

  handleUpload(data) {
    this.setState({
      step: 'ColumnSelection',
      data: data,
    });
  }

  handleSetProtect(i) {
    const headers = this.state.data.headers.slice();
    headers[i].protect = !headers[i].protect;
    this.setState({
      data: {headers: headers, contents: this.state.data.contents},
    });
  }

  handleProtect() {
    this.setState({
      protectedData: protectData(this.state.data),
      step: 'ProtectedData',
    });
  }

  handleSetStep(step) {
    this.setState({
      step: step,
    });
  }

  currentComponent(step) {
    const componentMap = {
      'FileUpload': <FileUpload onUpload={data => this.handleUpload(data)} />,
      'ColumnSelection': (<ColumnSelection
                            data={this.state.data}
                            protect={this.state.protect}
                            onSetProtect={i => this.handleSetProtect(i)}
                            onSetStep={step => this.handleSetStep(step)}
                            onProtect={() => this.handleProtect()}
                          />),
      'ProtectedData': (<ProtectedData
                          protectedData={this.state.protectedData}
                          onSetStep={step => this.handleSetStep(step)}
                        />),
    };
    return componentMap[step];
  }

  render() {
    return (
      <div className="container">
        {this.currentComponent(this.state.step)}
      </div>
    );
  }
}

function protectData(rawData) {

  const protectedData = {
    headers: [],
    contents: Array(rawData.contents.length),
  };

  // Can't use .fill() as it would give the same array reference to all.
  for (let i = 0; i < protectedData.contents.length; i++) {
    protectedData.contents[i] = [];
  }
  
  for (let i = 0; i < rawData.headers.length; i++) {
    protectedData.headers.push(rawData.headers[i].text);
    if (rawData.headers[i].protect) {
      protectedData.headers.push(rawData.headers[i].text + '_ENC');
    }
  }

  for (let i = 0; i < rawData.contents.length; i++) {

    for (let j = 0; j < rawData.headers.length; j++) {

      if (rawData.headers[j].protect) {
        protectedData.contents[i].push(hmac(rawData.contents[i][j]));
        protectedData.contents[i].push(encrypt(rawData.contents[i][j]));
      } else {
        protectedData.contents[i].push(rawData.contents[i][j]);
      }
    }
  }
  return protectedData;
}

function hmac(data) {
  const hmac = new sjcl.misc.hmac('hmac_secret_key');
  return sjcl.codec.base64.fromBits(hmac.encrypt(data));
}

function encrypt(data) {
  return sjcl.encrypt('encryption_secret_key', data, {mode:'gcm'})
}

export default App;
