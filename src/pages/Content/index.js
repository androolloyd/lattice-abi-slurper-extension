import { Client } from 'gridplus-sdk';
import superagent from 'superagent';
import { default as ReactCrypto } from 'gridplus-react-crypto';
import { Buffer } from 'buffer';

const parseAbi = new Client({
  crypto: new ReactCrypto('flaiksdfhjasoifjlksdfhlsdkfj'),
}).parseAbi;
const MAX_PARAM_NAME_LEN = 20;
const constants = {
  ETHERSCAN_KEY: 'Z61S2F3JUNFEWDNPS42DWUGQY8YN5GP6CP',
};

function getContractData(addr, cb) {
  const BASE = `https://api.etherscan.io`;
  const url = `${BASE}/api?module=contract&action=getabi&address=${addr}&apikey=${constants.ETHERSCAN_KEY}`;
  superagent.get(url).end((err, data) => {
    if (err) return cb(err.toString());
    const result = JSON.parse(data.text);
    if (result.message !== 'OK') return cb(result.result);
    return cb(null, JSON.parse(result.result));
  });
}

const main = async () => {
  //setup what we need to modify the dom
  const output = {};
  const settingsQuery = new Promise((resolve) => {
    chrome.storage.local.get(['relay', 'deviceID'], (result) => {
      resolve(result);
    });
  }).then((settings) => {
    output['settings'] = settings;
  });

  await settingsQuery;

  return output['settings'];
};

main()
  .then((settings) => {
    const writeContractButton = document.getElementById(
      'ContentPlaceHolder1_li_writeContract'
    );
    if (writeContractButton) {
      const list = document.createElement('li');
      list.className = 'nav-item';
      const btn = document.createElement('a');
      const btnName = 'Slurp ABI';
      btn.className = 'nav-link';
      btn.textContent = btnName;
      btn.setAttribute('href', 'javascript:;');
      btn.addEventListener('click', (e) => {
        const paths = window.location.toString().split('/');
        btn.textContent = 'Slurping....';
        const address = paths[4].split('#')[0];
        getContractData(address, (err, _defs) => {
          if (err) {
            btn.textContent = btnName;
            console.error(`Error for ${address}: ${err}`);
          } else if (!_defs) {
            btn.textContent = btnName;
            console.error('Did not receive response for ', address);
          } else {
            function defExists(def, defs) {
              defs.forEach((_def) => {
                if (def.sig === _def.sig) return true;
              });
              return false;
            }

            const name = 'ABI Slurper';
            const _genPrivKey = (deviceID, name) => {
              const key = Buffer.concat([
                Buffer.from(deviceID),
                Buffer.from(name),
              ]);
              return key;
              // Create a new instance of ReactCrypto using the key as entropy
            };
            const sdkSession = new Client({
              name: 'ABI Slurper',
              crypto: new ReactCrypto(_genPrivKey(settings['deviceID'], name)),
              timeout: 30000,
              baseUrl: settings['relay'],
              privKey: settings['deviceID'],
            });
            let defs = [];

            // Parse the defs and include ones with unique signatures
            parseAbi('etherscan', _defs, true).forEach((def) => {
              if (!defExists(def, defs)) defs.push(def);
            });
            sdkSession.connect(settings['deviceID'], (err, isPaired) => {
              if (err) {
                alert(err);
                btn.textContent = btnName;
              }
              if (!err && isPaired) {
                sdkSession.addAbiDefs(defs, (err) => {
                  if (err) {
                    alert(err);
                    btn.textContent = btnName;
                  } else {
                    alert('Successfully slurped ABIs');
                  }
                });
              }
              btn.textContent = btnName;
            });
          }
        });
      });
      btn.className = 'nav-link';
      writeContractButton.parentNode.appendChild(list);
      list.appendChild(btn);
    }
  })
  .catch((err) => console.log(err));
