//Install express server
const compression = require('compression');
const express = require('express');
const path = require('path');
var httpProxy = require('http-proxy');
var fs = require('fs');
const https = require('https');
const httpRequest = require('request');
const formidable = require('formidable');
var multiparty = require('multiparty');
const app = express();
const fetch = require('node-fetch');
var bodyParser = require('body-parser')
app.use(compression());
const FormData = require('form-data');


app.use(bodyParser.json());

const sourceMarketoEndpoint = "https://251-PAM-072.mktorest.com"; //shrikant+mrkt@marketing-automation.ca
const sourceMarketoClientId = "15b47c1d-8598-4a84-826c-441b90e04128";
const sourceMarketoSecretId = "wjSScpx2GKkRtRsGxZgbln17HXcbWaCt";


const targetMarketoEndpoint = "https://217-NBW-905.mktorest.com"; //shrikant+marketo@marketing-automation.ca
const targetMarketoClientId = "50656c1a-794b-49d8-a1bc-86bd9b2f8897";
const targetMarketoSecretId = "OEUOgFbjfz3Jx92qTtWjyxXQhQApqh7N";


// Serve only the static files form the dist directory
app.use(express.static(__dirname + '/dist/marketo-cicd-tool'));
app.use((req, res, next) => {
  if ((req.header('x-forwarded-proto') !== 'https' || req.url.indexOf('//') == 0) && req.header('host') != 'localhost:8080') {
      res.redirect(`https://${req.header('host')}${req.url}`)
    } else {
      next();
    }
});

var apiProxy = httpProxy.createProxyServer();



async function getAccessToken(endpoint, clientId, secretId){
  let access_token = '';
  return new Promise((resolve, reject) => {
    fetch(endpoint + '/identity/oauth/token?grant_type=client_credentials&client_id='+ clientId +'&client_secret=' + secretId, {  }).then(response => {
      if(response){
        let result = response.json().then(json => {
          access_token = json.access_token;
          resolve(access_token);
        });

      }
    });
  });
}


app.all("/get/target/*", function (request, response) {
  getAccessToken(targetMarketoEndpoint, targetMarketoClientId, targetMarketoSecretId).then(access_token => {
    let url = targetMarketoEndpoint + request.url.replace('/get/target', '');
      httpRequest.get(url, {
        headers: {
          'Authorization': "Bearer " + access_token
        },
        encoding: null,
        timeout: 120000
      }, (error, res, body) => {
        if (error) {
          console.error(error)
          return
        }
        let headers = {};
        Object.keys(res.headers).forEach(header => {
          if (header != 'content-disposition')
            headers[header] = res.headers[header];
        });
        response.writeHead(200, headers);
        response.end(body);
      })
    });
  });

app.all("/post/target/*", function (request, response) {
  getAccessToken(targetMarketoEndpoint, targetMarketoClientId, targetMarketoSecretId).then(access_token => {
    let url = targetMarketoEndpoint + request.url.replace('/post/target', '');
    if(request.headers['original-content'] == 'application/x-www-form-urlencoded'){
      httpRequest.post(url, {
        headers: {
          'Authorization': "Bearer " + access_token,
          'Content-type': request.headers['original-content'],
        },
        encoding: null,
        timeout: 120000
      }, (error, res, body) => {
        if (error) {
          console.error(error)
          return
        }
        let headers = {};
        Object.keys(res.headers).forEach(header => {
          if (header != 'content-disposition')
            headers[header] = res.headers[header];
        });
        response.writeHead(200, headers);
        response.end(body);
      })
    }else if(request.headers['original-content'].indexOf('multipart/form-data') > -1){
       fs.writeFileSync(__dirname + '/deployment/template.txt', request.body.content);
      // fs.readFile(__dirname + '/deployment/template.txt', function (err, data) {
             httpRequest.post(url, {
              formData: {
                content: fs.createReadStream(__dirname + '/deployment/template.txt')
              },
                headers: {
                  'Authorization': "Bearer " + access_token,
                  'Content-type': request.headers['original-content']
                },
                encoding: null,
                timeout: 120000
              }, (error, res, body) => {
                if (error) {
                  console.error(error)
                  return
                }
                let headers = {};
                Object.keys(res.headers).forEach(header => {
                  if (header != 'content-disposition')
                    headers[header] = res.headers[header];
                });
                response.writeHead(200, headers);
                response.end(body);
              });
       //});
     // formData.append('file', new Blob([str], { type : 'plain/text' }), 'simple_pdf.pdf');
    // form.append('content', new Blob([text], { type : 'plain/text' }), 'template.txt');


    }
    });
  });

app.all("/get/source/*", function (request, response) {
  getAccessToken(sourceMarketoEndpoint, sourceMarketoClientId, sourceMarketoSecretId).then(access_token => {
    let url = sourceMarketoEndpoint + request.url.replace('/get/source', '');
      httpRequest.get(url, {
        headers: {
          'Authorization': "Bearer " + access_token
        },
        encoding: null,
        timeout: 120000
      }, (error, res, body) => {
        if (error) {
          console.error(error)
          return
        }
        let headers = {};
        Object.keys(res.headers).forEach(header => {
          if (header != 'content-disposition')
            headers[header] = res.headers[header];
        });
        response.writeHead(200, headers);
        response.end(body);
      })
    });
  });
// app.all("/resources/*", function (req, res) {
//     apiProxy.web(req, res, { changeOrigin: true,target: resourceForwardingUrl });
// });


// app.all("/preview*", function (request, response) {
//   let url = request.query.url;
//   httpRequest.get(url, {
//     encoding: null,
//     timeout: 120000
//   }, (error, res, body) => {
//     if (error) {
//       console.error(error)
//       return
//     }
//     let headers = {};
//     Object.keys(res.headers).forEach(header => {
//       if (header != 'content-disposition')
//         headers[header] = res.headers[header];
//     });
//     response.writeHead(200, headers);
//     response.end(body);
//   })
// });


app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});






// const options = {
//   key: fs.readFileSync('server.key'),
//   cert: fs.readFileSync('server.cert')
// }

// var server = https.createServer(options, app).listen(process.env.PORT || 8080, () => {
//   console.log("Express server listening on port " + 8080);
// });


// Start the app by listening on the default Heroku port
app.listen(process.env.PORT || 8080);
