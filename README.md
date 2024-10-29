# SSI Camera Access

The deployment repository of the SSI-based remote camera access demo.

This repository consists of two parts:
- **Organizer App**, and
- **Media Server**.

## Organizer App (`organizer_app`)

Consists of two components:
- **HTTP API**
  - Create a Meeting Event - POST request: `/api/meetings`
  - Get a Meeting Event - GET request: `/api/meetings/<meeting_id>`.
- **Web Interface**

### Run the service for the organizer

Note: Make sure you have the SSI issuer running

Install the required packages
``` shell
$ cd server && pip install .
```

Run the organizer server:
``` shell
$ cd server && gunicorn -b <host:port>                        \
              -w <num_workers>                      \
              -k gevent                             \
              -t 0                                  \
              --log-level <log_level>               \
              --access-logfile <requests_log_file>  \
              --error-logfile <errors_log_file>     \
              'ssi_organizer:app'
```

### Run the client application for the organizer

Install the required packages
``` shell
$ cd client_app && npm i
```

Run the application which comes up on port 3001
``` shell
$ cd client_app && npm run start
```

## Media Server (`media_server`)

Consists of two components:
- **HTTP API**
  - Authenticate with SSI: `/auth`.
  - Stream live videos from cameras: `/camera-feed/<camera_id>`.
  - Control the access to the cameras via SSI.
- **Web Interface**

### Configuration

The `camera_mapping.json` is a configuration file:
``` json
{
    "0": "0",
    "1": "rtsp://admin:<password>@<ip_address>:<port>/<stream_name>"
}
```
 It stores the mapping between the API-exposed camera identifiers
(`camera_id`) and Open CV-compatible camera descriptors. `camera_id` can be any string. The right-hand side must
conform to `VideoCapture` from Open CV. We support USB-connected and RTSP-enabled IP cameras.

### Install
``` shell
$ pip install .
```

Use `install -e` for development.

### Run

``` shell
$ gunicorn -b <host:port>                        \
           -w <num_workers>                      \
           -k gevent                             \
           -t 0                                  \
           --log-level <log_level>               \
           --access-logfile <requests_log_file>  \
           --error-logfile <errors_log_file>     \
           'ssi_camera:app'
```

This runs the HTTP server and prints the output in the shell. Find the URL there.

Note that we need asynchronous workers (`gevent`) and their timeout turned off to support video streaming in `gunicorn`.

Depending on your operating system permission settings, you may need to grant the permissions to `ssi-camera` to access
your cameras. In most operating systems, this should be done only the first time, as the permissions are persistent.

### Security Concerns

Do not use this service in deployments until at least the following is implemented:
- HTTPS for all requests including `/auth` and `/camera-feed/<camera_id>`
- Put `nginx` (or the like) as a forward proxy to `gunicorn`.
- Use cookies for session identification instead of request parameters. Request parameters are typically logged on
  proxies and the session identification tokens are prone to replay attacks. However, the string query parameters should
  be encrypted under HTTPS (see
  [cio.gov](https://https.cio.gov/faq/#:~:text=An%20encrypted%20HTTPS%20request%20protects,encrypted%2C%20as%20are%20POST%20bodies)).

#### Authentication flow

- Client submits VP to `/auth`,
- If VP verifies, server stores the VP associated with a session id (SID),
- Server responds with the SID in the body,
- Client accesses `/camera-feed/<camera_id>` with the `sid` **request parameter in the URL**.
- Server loads the VP associated with the `sid` and does the access control based on the retrieved VP.

### Issues

- The docker instructions are not ready yet. By default, USB-connected camera devices are not captured from within
  containers. On Linux, one can try the following to forward cameras to the container:

  ``` shell
  docker run --device /dev/video0:/dev/video0 ...
  ```

- Organizer may not be able to handle asynchronous requests, need to probably move to a high speed, high number of read write requests handler such as Redis.
