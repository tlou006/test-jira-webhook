import './App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

const authState = '12345';
const jiraAppClientId = 'F7G5Yc4D3uwfTEZF5wZlUq0aUyp16Qrj';
const jiraAppClientSecret = 'ATOAE1x81PC4hCSSXDOH87fLR2aM8etM74tb8R3Y2rHk-ItpE4DQ-CnKIwaydc7mXjeh5730E224';
// Available here https://YOURTENANT.atlassian.net/_edge/tenant_info
const cloudId = '';

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const [authCode, setAuthCode] = useState(urlParams.get('code') || null);
  const [accessToken, setAccessToken] = useState();

  useEffect(() => {
    (async () => {
      if (!authCode || accessToken) {
        return;
      }

      console.log('Token Exchange');
      const tokenResponse = await axios.post('https://auth.atlassian.com/oauth/token', {
        grant_type: "authorization_code",
        client_id: jiraAppClientId,
        client_secret: jiraAppClientSecret,
        code: authCode,
        redirect_uri: 'http://localhost:3000'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const {access_token} = tokenResponse.data;
      setAccessToken(access_token);

    })();
  }, [authCode]);

  function createWebhooks() {
    return axios.post(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/webhook`, {
      webhooks: [{
        jqlFilter: "project = SSP",
        events: [ "jira:issue_created" ]
      }, 
      {
        jqlFilter: "project = SSP",
        events: [ "jira:issue_updated" ]
      },
      {
        jqlFilter: "project = SSP",
        events: ["jira:issue_deleted" ]
      }],
      url: 'https://funny-safe-cheetah.ngrok-free.app'
    }, {
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      }
    });
  }

  async function deleteWebhooks() {
    const getWebhooksResponse = await axios.get(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/webhook`, {
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      }
    });
    const webhookIds = getWebhooksResponse.data.values.map(w => Number.parseInt(w.id));

    if (!webhookIds || !webhookIds.length) {
      return;
    }

    return axios.delete(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/webhook`, {
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      data: {
        webhookIds
      }
    });
  }

  return (
    <div className="App">
      <h1>Testing Jira Webhooks</h1>
      <a href={`https://auth.atlassian.com/authorize?audience=api.atlassian.com
        &client_id=${jiraAppClientId}&scope=read%3Ajira-work%20write%3Ajira-work%20manage%3Ajira-configuration%20manage%3Ajira-webhook
        &redirect_uri=http%3A%2F%2Flocalhost%3A3000&state=${authState}&response_type=code&prompt=consent`}>Auth</a>
      {accessToken && (<>
        <button onClick={createWebhooks}>Create Webhooks</button>
        <button onClick={deleteWebhooks}>Delete Webhooks</button>
      </>)}
    </div>
  );
}

export default App;
