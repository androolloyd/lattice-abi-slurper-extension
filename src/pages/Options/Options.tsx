import React, { FC, useEffect, useState } from 'react';
import './Options.css';
// @ts-ignore
import { Client } from 'gridplus-sdk';
// @ts-ignore
import { default as ReactCrypto } from 'gridplus-react-crypto';
import { Buffer } from 'buffer';
interface OptionsProps {
  title: string;
}

interface LatticeProps {}

const LatticeSettings: FC<LatticeProps> = ({}: LatticeProps) => {
  const settingKeys = ['relay', 'deviceID', 'etherscan'];
  const [settings, setSettings]: any = useState({
    relay: '',
    etherscan: '',
    deviceID: '',
  });
  useEffect(() => {
    chrome.storage.local.get(settingKeys, (result) => {
      setSettings(result);
      console.log(result);
    });
  }, [setSettings]);

  const updateSettings = async () => {
    if (!settings['sessionKey']) {
      //generate new sessionkey with crypto pw
    }
    chrome.storage.local.set(settings, () => {
      console.log('settings update');
    });
  };

  const _genPrivKey = (deviceID: any, name: any) => {
    const key = Buffer.concat([Buffer.from(deviceID), Buffer.from(name)]);
    return key;
    // Create a new instance of ReactCrypto using the key as entropy
  };

  const connectToLattice = async () => {
    const name = 'ABI Slurper';
    const sdkSession: any = new Client({
      name: name,
      crypto: new ReactCrypto(_genPrivKey(settings['deviceID'], name)),
      timeout: 30000,
      baseUrl: settings['relay'],
      privKey: settings['deviceID'],
    });

    sdkSession.connect(settings['deviceID'], (err: any, isPaired: any) => {
      console.log(isPaired);
      if (err) {
        alert(err);
      } else if (!err && !isPaired) {
        const pairingCode: any = prompt(
          'Please enter the pairing code on the device'
        );
        if (pairingCode) {
          sdkSession.pair(pairingCode, (err: any) => {
            if (!err) {
              alert('Connected');
            }
          });
        }
      } else {
        alert('Already connected');
      }
    });
  };

  const handleChangeEvent = (e: any) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div>
      <ul>
        <li>
          Relay:{' '}
          <input
            name={'relay'}
            type={'text'}
            value={settings['relay']}
            onChange={handleChangeEvent}
          />
        </li>
        <li>
          DeviceID:{' '}
          <input
            name={'deviceID'}
            type={'text'}
            value={settings['deviceID']}
            onChange={handleChangeEvent}
          />
        </li>
        <li>
          Etherscan API Key:{' '}
          <input
            name={'etherscan'}
            type={'text'}
            value={settings['etherscan']}
            onChange={handleChangeEvent}
          />
        </li>
        <li>
          <button onClick={updateSettings}>Save</button>
          <button onClick={connectToLattice}>Connect</button>
        </li>
      </ul>
    </div>
  );
};
// }
// const LatticeSettings: ({}: LatticeProps) => JSX.Element =
//   ({}: LatticeProps) => {
//     const setValues = (key: any, value: any) => {
//       let obj: any = {};
//       obj[key] = value;
//       chrome.storage.local.set(obj, function () {
//         console.log('Value is set to ' + value);
//       });
//     };
//     const getValues = async () => {
//       const executor = async () => {
//         chrome.storage.local.get(
//           ['relayEndpoint', 'deviceId'],
//           function (result) {
//             return result;
//           }
//         );
//       };
//       return executor();
//     };
//
//     const state = await getValues();
//
//     return (
//       <div>
//         <ul>
//           <li>Lattice Relay: {state['relay']}</li>
//         </ul>
//       </div>
//     );
//   };

const Options: React.FC<OptionsProps> = ({ title }: OptionsProps) => {
  return (
    <div className="OptionsContainer">
      <div>
        <h2>{title.toUpperCase()} PAGE</h2>
        <LatticeSettings />
      </div>
    </div>
  );
};

export default Options;
