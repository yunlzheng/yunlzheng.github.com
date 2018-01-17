title: Kong API Gateway 
date: 2017-12-14 13:15:41
tags: [OpenSource]
---

## 安全，可管理, 易扩展

![https://getkong.org/assets/images/homepage/intro-illustration.png](https://getkong.org/assets/images/homepage/intro-illustration.png)

## 安装

启动数据库

或者使用PostgreSQL

```
docker run -d --name kong-database \
              -p 5432:5432 \
              -e "POSTGRES_USER=kong" \
              -e "POSTGRES_DB=kong" \
              postgres:9.4
```

准备数据库
```
docker run --rm \
    --link kong-database:kong-database \
    -e "KONG_DATABASE=postgres" \
    -e "KONG_PG_HOST=kong-database" \
    -e "KONG_CASSANDRA_CONTACT_POINTS=kong-database" \
    kong:latest kong migrations up
```

启动Kong

```
docker run -d --name kong \
    --link kong-database:kong-database \
    -e "KONG_DATABASE=postgres" \
    -e "KONG_PG_HOST=kong-database" \
    -e "KONG_CASSANDRA_CONTACT_POINTS=kong-database" \
    -e "KONG_PROXY_ACCESS_LOG=/dev/stdout" \
    -e "KONG_ADMIN_ACCESS_LOG=/dev/stdout" \
    -e "KONG_PROXY_ERROR_LOG=/dev/stderr" \
    -e "KONG_ADMIN_ERROR_LOG=/dev/stderr" \
    -p 8000:8000 \
    -p 8443:8443 \
    -p 8001:8001 \
    -p 8444:8444 \
    kong:latest
```

```
curl -i http://localhost:8001/

```

响应内容

```
HTTP/1.1 200 OK
Date: Thu, 14 Dec 2017 06:01:54 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.11.2

{
  "version":"0.11.2",
  "plugins":{
    "enabled_in_cluster":[],
    "available_on_server":{
      "response-transformer":true,
      "correlation-id":true,
      "statsd":true,
      "jwt":true,
......
```

## API管理

### 创建API实例

```
curl -i -X POST \
  --url http://localhost:8001/apis/ \
  --data 'name=example-api' \
  --data 'hosts=example.com' \
  --data 'upstream_url=http://mockbin.org'
```

响应内容

```
HTTP/1.1 201 Created
Date: Thu, 14 Dec 2017 06:03:59 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.11.2

{
  "created_at":1513231439698,
  "strip_uri":true,
  "id":"d1ee40d9-0e6a-4fc6-b98d-82f4c21f058e",
  "hosts":["example.com"],
  "name":"example-api",
  "http_if_terminated":false,
  "preserve_host":false,
  "upstream_url":"http:\/\/mockbin.org",
  "upstream_connect_timeout":60000,
  "upstream_send_timeout":60000,
  "upstream_read_timeout":60000,
  "retries":5,
  "https_only":false
}
```

通过Kong代理请求

```
curl -i -X GET --url http://localhost:8000/ --header 'Host: example.com'

```

响应内容

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Date: Thu, 14 Dec 2017 06:13:54 GMT
Set-Cookie: __cfduid=dc044feac13b87faef04393416b8821671513232033; expires=Fri, 14-Dec-18 06:13:53 GMT; path=/; domain=.mockbin.org; HttpOnly
Vary: Accept-Encoding
Via: kong/0.11.2
Server: cloudflare-nginx
CF-RAY: 3ccf051467a351c4-SJC
X-Kong-Upstream-Latency: 768
X-Kong-Proxy-Latency: 1698

<!DOCTYPE html><html><head>....
```

### 启用key-auth插件

```
curl -i -X POST \
  --url http://localhost:8001/apis/example-api/plugins/ \
  --data 'name=key-auth'
```

响应内容

```
HTTP/1.1 201 Created
Date: Thu, 14 Dec 2017 06:26:27 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.11.2

{
  "created_at":1513232787000,
  "config":{
    "key_in_body":false,
    "run_on_preflight":true,
    "anonymous":"",
    "hide_credentials":false,
    "key_names":["apikey"]
  },"id":"80e749b7-350c-471e-b9a2-3f4aae274576",
  "name":"key-auth",
  "api_id":"d1ee40d9-0e6a-4fc6-b98d-82f4c21f058e",
  "enabled":true
}
```

验证插件是否启用

```
curl -i -X GET --url http://localhost:8000/ --header 'Host: example.com'
```

```
HTTP/1.1 401 UnauthorizedDate: Thu, 14 Dec 2017 06:33:48 GMTContent-Type: application/json; charset=utf-8Transfer-Encoding: chunkedConnection: keep-aliveWWW-Authenticate: Key realm="kong"Server: kong/0.11.2{"message":"No API key found in request"}
```

### 创建API消费者

> Kong支持**custom_id**参数，这样可以用来将customer与数据库中已存在的用户进行关联

```
curl -i -X POST \
  --url http://localhost:8001/consumers/ \
  --data "username=Jason"
```

```
HTTP/1.1 201 Created
Date: Thu, 14 Dec 2017 06:28:20 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.11.2

{
  "created_at":1513232900000,
  "username":"Jason",
  "id":"0a3ae8b9-caf3-4c8a-972d-82eedfaba345"
}
```

创建消费者key

```
curl -i -X POST \
  --url http://localhost:8001/consumers/Jason/key-auth/ \
  --data 'key=ENTER_KEY_HERE'
```

```
HTTP/1.1 201 Created
Date: Thu, 14 Dec 2017 06:29:10 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.11.2

{"id":"d32cda49-1613-42ed-8828-5853efd40d8a","created_at":1513232951000,"key":"ENTER_KEY_HERE","consumer_id":"0a3ae8b9-caf3-4c8a-972d-82eedfaba345"}
```

验证消费者凭证

```
curl -i -X GET \
  --url http://localhost:8000 \
  --header "Host: example.com" \
  --header "apikey: ENTER_KEY_HERE"
```

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Date: Thu, 14 Dec 2017 06:31:12 GMT
Set-Cookie: __cfduid=d4f78f3515c047248cda6c7e7875daf3f1513233072; expires=Fri, 14-Dec-18 06:31:12 GMT; path=/; domain=.mockbin.org; HttpOnly
Vary: Accept-Encoding
Via: kong/0.11.2
Server: cloudflare-nginx
CF-RAY: 3ccf1e6d40a028ac-SJC
X-Kong-Upstream-Latency: 711
X-Kong-Proxy-Latency: 1187

<!DOCTYPE html><html><head>
```

## 参考资料

* https://github.com/Kong/kong
* https://github.com/Kong/docker-kong