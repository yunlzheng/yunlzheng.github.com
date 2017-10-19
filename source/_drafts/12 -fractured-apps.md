12 Fractured Apps
=================

Over the years I’ve witnessed more and more people discover the 12 Fact0r App manifesto and start implementing many of the suggestions outlined there. This has led to applications that are far easier to deploy and manage. However practical examples of 12 Factor were a rare sight to see in the wild.

这几年，我开始看到越来越多的人开始讨论**应用12要素**，并且开始尝试当中提出的建议。这可以让我们的更加容器的管理和部署我们的应用程序。然后关于12要素的例子却并不多见。

Once Docker hit the scene the benefits of the 12 Factor App (12FA) really started to shine. For example, 12FA recommends that logging should be done to stdout and be treated as an event stream. Ever run the docker logs command? That’s 12FA in action!

12FA also suggests applications should use environment variables for configuration. Again Docker makes this trivial by providing the ability to set env vars programmatically when creating containers.

> Docker and 12 factor apps are a killer combo and offer a peek into the future of application design and deployment.

Docker also makes it somewhat easy to “lift and shift” legacy applications to containers. I say “somewhat” because what most people end up doing is treating Docker containers like VMs, resulting in 2GB container images built on top of full blown Linux distros.

Unfortunately legacy applications, including the soon-to-be-legacy application you are working on right now, have many shortcomings, especially around the startup process. Applications, even modern ones, make too many assumptions and do very little to ensure a clean startup. Applications that require an external database will normally initialize the database connection during startup. However, if that database is unreachable, even temporarily, many applications will simply exit. If you’re lucky you might get an error message and non-zero exit code to aid in troubleshooting.

> Many of the applications that are being packaged for Docker are broken in subtle ways. So subtle people would not call them broken, it’s more like a hairline fracture — it works but hurts like hell when you use them.

This kind of application behavior has forced many organizations into complex deployment processes and contributed to the rise of configuration management tools like Puppet or Ansible. Configuration management tools can solve the “missing” database problem by ensuring the database is started before the applications that depend on it. This is nothing more then a band-aid covering up the larger problem. The application should simply retry the database connection, using some sort of backoff, and log errors along the way. At some point either the database will come online, or your company will be out of business.

Another challenge for applications moving to Docker is around configuration. Many applications, even modern ones, still rely on local, on-disk, configuration files. It’s often suggested to simply build new “deployment” containers that bundle the configuration files in the container image.

## Don’t do this.

If you go down this road you will end up with an endless number of container images named something like this:

* application-v2–prod-01022015
* application-v2-dev-02272015

You’ll soon be in the market for a container image management tool.

The move to Docker has given people the false notion they no longer need any form of configuration management. I tend to agree, there is no need to use Puppet, Chef, or Ansible to build container images, but there is still a need to manage runtime configuration settings.

The same logic used to do away with configuration management is often used to avoid all init systems in favor of the docker run command.

To compensate for the lack of configuration management tools and robust init systems, Docker users have turned to shell scripts to mask application shortcomings around initial bootstrapping and the startup process.

> Once you go all in on Docker and refuse to use tools that don’t bear the Docker logo you paint yourself into a corner and start abusing Docker.

## Example Application

The remainder of this post will utilize an example program to demonstrate a few common startup tasks preformed by a typical application. The example application performs the following tasks during startup:

* Load configuration settings from a JSON encoded config file
* Access a working data directory
* Establish a connection to an external mysql database

```
package main

import (
    "database/sql"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "log"
    "net"
    "os"

    _ "github.com/go-sql-driver/mysql"
)

var (
    config Config
    db     *sql.DB
)

type Config struct {
    DataDir string `json:"datadir"`

    // Database settings.
    Host     string `json:"host"`
    Port     string `json:"port"`
    Username string `json:"username"`
    Password string `json:"password"`
    Database string `json:"database"`
}

func main() {
    log.Println("Starting application...")
    // Load configuration settings.
    data, err := ioutil.ReadFile("/etc/config.json")
    if err != nil {
        log.Fatal(err)
    }
    if err := json.Unmarshal(data, &config); err != nil {
        log.Fatal(err)
    }

    // Use working directory.
    _, err = os.Stat(config.DataDir)
    if err != nil {
        log.Fatal(err)
    }
    // Connect to database.
    hostPort := net.JoinHostPort(config.Host, config.Port)
    dsn := fmt.Sprintf("%s:%s@tcp(%s)/%s?timeout=30s",
        config.Username, config.Password, hostPort, config.Database)

    db, err = sql.Open("mysql", dsn)
    if err != nil {
        log.Fatal(err)
    }

    if err := db.Ping(); err != nil {
        log.Fatal(err)
    }
}
```

The complete source code of the example program is available on GitHub.

As you can see there’s nothing special here, but if you look closely you can see this application will only startup under specific conditions, which we’ll call the happy path. If the configuration file or working directory is missing, or the database is not available during startup, the above application will fail to start. Let’s deploy the example application via Docker and examine this first hand.

Build the application using the go build command:

```
$ GOOS=linux go build -o app .
```

Create a Docker image using the following Dockerfile:

```
FROM scratch
MAINTAINER Kelsey Hightower <kelsey.hightower@gmail.com>
COPY app /app
ENTRYPOINT ["/app"]
```

All I’m doing here is copying the application binary into place. This container image will use the scratch base image, resulting in a minimal Docker image suitable for deploying our application. Remember, ship artifacts not build environments.

Create the Docker image using the docker build command:

```
$ docker build -t app:v1 .
```

Finally, create a Docker container from the app:v1 Docker image using the docker run command:

```
$ docker run --rm app:v1
2015/12/13 04:00:34 Starting application...
2015/12/13 04:00:34 open /etc/config.json: no such file or directory
```

Let the pain begin! Right out of the gate I hit the first startup problem. Notice the application fails to start because of the missing /etc/config.json configuration file. I can fix this by bind mounting the configuration file at runtime:

```
$ docker run --rm \
  -v /etc/config.json:/etc/config.json \
  app:v1
2015/12/13 07:36:27 Starting application...
2015/12/13 07:36:27 stat /var/lib/data: no such file or directory
```

Another error! This time the application fails to start because the /var/lib/data directory does not exist. I can easily work around the missing data directory by bind mounting another host dir into the container:

```
$ docker run --rm \
  -v /etc/config.json:/etc/config.json \
  -v /var/lib/data:/var/lib/data \
  app:v1
2015/12/13 07:44:18 Starting application...
2015/12/13 07:44:48 dial tcp 203.0.113.10:3306: i/o timeout
```

Now we are making progress, but I forgot to configure access to the database for this Docker instance.

This is the point where some people start suggesting that configuration management tools should be used to ensure that all these dependencies are in place before starting the application. While that works, it’s pretty much overkill and often the wrong approach for application-level concerns.

> I can hear the silent cheers from hipster “sysadmins” sipping on a cup of Docker Kool-Aid eagerly waiting to suggest using a custom Docker entrypoint to solve our bootstrapping problems.

## Custom Docker entrypoints to the rescue

One way to address our startup problems is to create a shell script and use it as the Docker entrypoint in place of the actual application. Here’s a short list of things we can accomplish using a shell script as the Docker entrypoint:

* Generate the required /etc/config.json configuration file
* Create the required /var/lib/data directory
* Test the database connection and block until it’s available

The following shell script tackles the first two items by adding the ability to use environment variables in-place of the /etc/config.json configuration file and creating the missing /var/lib/data directory during the startup process. The script executes the example application as the final step, preserving the original behavior of starting the application by default.

```
#!/bin/sh
set -e
datadir=${APP_DATADIR:="/var/lib/data"}
host=${APP_HOST:="127.0.0.1"}
port=${APP_PORT:="3306"}
username=${APP_USERNAME:=""}
password=${APP_PASSWORD:=""}
database=${APP_DATABASE:=""}
cat <<EOF > /etc/config.json
{
  "datadir": "${datadir}",
  "host": "${host}",
  "port": "${port}",
  "username": "${username}",
  "password": "${password}",
  "database": "${database}"
}
EOF
mkdir -p ${APP_DATADIR}
exec "/app"
```

The Docker image can now be rebuilt using the following Dockerfile:

```
FROM alpine:3.1
MAINTAINER Kelsey Hightower <kelsey.hightower@gmail.com>
COPY app /app
COPY docker-entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

> Notice the custom shell script is copied into the Docker image and used as the entrypoint in place of the application binary.

Build the app:v2 Docker image using the docker build command:

```
$ docker build -t app:v2 .
```

Now run it:

```
$ docker run --rm \
  -e "APP_DATADIR=/var/lib/data" \
  -e "APP_HOST=203.0.113.10" \
  -e "APP_PORT=3306" \
  -e "APP_USERNAME=user" \
  -e "APP_PASSWORD=password" \
  -e "APP_DATABASE=test" \
  app:v2
2015/12/13 04:44:29 Starting application...
```

The custom entrypoint is working. Using only environment variables we are now able to configure and run our application.

But why are we doing this?

Why do we need to use such a complex wrapper script? Some will say it’s much easier to write this functionality in shell then doing it in the app. But the cost is not only in managing shell scripts. Notice the other difference between the v1 and v2 Dockerfiles?

```
FROM alpine:3.1
```

The v2 Dockerfile uses the alpine base image to provide a scripting environment, while small, it does double the size of our Docker image:

```
$ docker images
REPOSITORY  TAG  IMAGE ID      CREATED      VIRTUAL SIZE
app         v2   1b47f1fbc7dd  2 hours ago  10.99 MB
app         v1   42273e8664d5  2 hours ago  5.952 MB
```

The other drawback to this approach is the inability to use a configuration file with the image. We can continue scripting and add support for both the configuration file and env vars, but this is just going down the wrong path, and it will come back to bite us at some point when the wrapper script gets out of sync with the application.

There is another way to fix this problem.

## Programming to the rescue

Yep, good old fashion programming. Each of the issues being addressed in the docker-entrypoint.sh script can be handled directly by the application.

Don’t get me wrong, using an entrypoint script is ok for applications you don’t have control over, but when you rely on custom entrypoint scripts for applications you write, you add another layer of complexity to the deployment process for no good reason.

### Config files should be optional

There is absolutely no reason to require a configuration file after the 90s. I would suggest loading the configuration file if it exists, and falling back to sane defaults. The following code snippet does just that.

```
// Load configuration settings.
data, err := ioutil.ReadFile("/etc/config.json")
// Fallback to default values.
switch {
    case os.IsNotExist(err):
        log.Println("Config file missing using defaults")
        config = Config{
            DataDir: "/var/lib/data",
            Host: "127.0.0.1",
            Port: "3306",
            Database: "test",
        }
    case err == nil:
        if err := json.Unmarshal(data, &config); err != nil {
            log.Fatal(err)
        }
    default:
        log.Println(err)
}
```

### Using env vars for config

This is one of the easiest things you can do directly in your application. In the following code snippet env vars are used to override configuration settings.

```
log.Println("Overriding configuration from env vars.")
if os.Getenv("APP_DATADIR") != "" {
    config.DataDir = os.Getenv("APP_DATADIR")
}
if os.Getenv("APP_HOST") != "" {
    config.Host = os.Getenv("APP_HOST")
}
if os.Getenv("APP_PORT") != "" {
    config.Port = os.Getenv("APP_PORT")
}
if os.Getenv("APP_USERNAME") != "" {
    config.Username = os.Getenv("APP_USERNAME")
}
if os.Getenv("APP_PASSWORD") != "" {
    config.Password = os.Getenv("APP_PASSWORD")
}
if os.Getenv("APP_DATABASE") != "" {
    config.Database = os.Getenv("APP_DATABASE")
}
```

### Manage the application working directories

Instead of punting the responsibility of creating working directories to external tools or custom entrypoint scripts your application should manage them directly. If they are missing create them. If that fails be sure to log an error with the details:

```
// Use working directory.
_, err = os.Stat(config.DataDir)
if os.IsNotExist(err) {
    log.Println("Creating missing data directory", config.DataDir)
    err = os.MkdirAll(config.DataDir, 0755)
}
if err != nil {
    log.Fatal(err)
}
```

### Eliminate the need to deploy services in a specific order

Do not require anyone to start your application in a specific order. I’ve seen too many deployment guides warn users to deploy an application after the database because the application would fail to start.

Stop doing this. Here’s how:

```
$ docker run --rm \
  -e "APP_DATADIR=/var/lib/data" \
  -e "APP_HOST=203.0.113.10" \
  -e "APP_PORT=3306" \
  -e "APP_USERNAME=user" \
  -e "APP_PASSWORD=password" \
  -e "APP_DATABASE=test" \
  app:v3
2015/12/13 05:36:10 Starting application...
2015/12/13 05:36:10 Config file missing using defaults
2015/12/13 05:36:10 Overriding configuration from env vars.
2015/12/13 05:36:10 Creating missing data directory /var/lib/data
2015/12/13 05:36:10 Connecting to database at 203.0.113.10:3306
2015/12/13 05:36:40 dial tcp 203.0.113.10:3306: i/o timeout
2015/12/13 05:37:11 dial tcp 203.0.113.10:3306: i/o timeout
```

> Notice in the above output that I’m not able to connect to the target database running at 203.0.113.10.

After running the following command to grant access to the “mysql” database:

```
$ gcloud sql instances patch mysql \
  --authorized-networks "203.0.113.20/32"
```

The application is able to connect to the database and complete the startup process.

```
2015/12/13 05:37:43 dial tcp 203.0.113.10:3306: i/o timeout
2015/12/13 05:37:46 Application started successfully.
```

The code to make this happen looks like this:

```
// Connect to database.
hostPort := net.JoinHostPort(config.Host, config.Port)
log.Println("Connecting to database at", hostPort)
dsn := fmt.Sprintf("%s:%s@tcp(%s)/%s?timeout=30s",
    config.Username, config.Password, hostPort, config.Database)
db, err = sql.Open("mysql", dsn)
if err != nil {
    log.Println(err)
}
var dbError error
maxAttempts := 20
for attempts := 1; attempts <= maxAttempts; attempts++ {
    dbError = db.Ping()
    if dbError == nil {
        break
    }
    log.Println(dbError)
    time.Sleep(time.Duration(attempts) * time.Second)
}
if dbError != nil {
    log.Fatal(dbError)
}
```

Nothing fancy here. I’m simply retrying the database connection and increasing the time between each attempt.

Finally, we wrap up the startup process with a friendly log message that the application has started correctly. Trust me, your sysadmin will thank you.

```
log.Println("Application started successfully.")
```

## Summary

Everything in this post is about improving the deployment process for your applications, specifically those running in a Docker container, but these ideas should apply almost anywhere. On the surface it may seem like a good idea to push application bootstrapping tasks to custom wrapper scripts, but I urge you to reconsider. Deal with application bootstrapping tasks as close to the application as possible and avoid pushing this burden onto your users, which in the future could very well be you.