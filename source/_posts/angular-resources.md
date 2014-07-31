title: 使用Angular Resources 封装Rest API
date: 2014-07-31 15:22:57
tags:
---

## 使用[$http](http://docs.angularjs.org/api/ng/service/$http)直接访问接口

$http是angular提供的http调用的基础服务。

基本用法为：


    $http(config);


config对象主要包含对诸如请求地址url,请求方法method,查询参数参数param.以及post对应的data等。 对于某些特定的http服务如oauth等需要在http头信息中包含一些特定的数据，这些都可以在config中进行配置，配置详情请参考[官方文档](http://docs.angularjs.org/api/ng/service/$http)。

除此之外$http还提供了一些快捷方法如下所示：


    $http.get(url, [config])
    $http.head(url, [config])
    $http.post(url, data, [config])
    $http.put(url, data, [config])
    $http.delete(url, [config])
    $http.jsonp(url, [config])


示例：

    $http({method: 'GET', url: '/someUrl'}).
        success(function(data, status, headers, config) {
          // this callback will be called asynchronously
          // when the response is available
        }).
        error(function(data, status, headers, config) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
        });

除此之外$http还提供了请求拦截机制Interceptors可以对api请求进行统一的错误处理等功能。

## $http结合Factory封装访问接口

factory是Angular中$provide注册组件的方法之一（常用的其他方法还包括provider,value,service），这里可以简单理解为一个对象工厂(if you code java)， 通过注册一个factory我们可以将后端程序提供的API接口进行统一的封装。

示例：

定义工厂：


    angular.module('someApp')
        .factory('FactoryName', ['$http', function(){
            return {
                get: function(){ return $http.get('someUrl'); },
                query: function(){ return $http.get('someUrl'); },
                update: function(){ return $http.put('someUrl'); },
                delete: function(){ return $http.del('someUrl'); },
                otherAction: function(){ return $http.del('someUrl'); }
            }
        }]);


在controllrt中使用：

    angular.module('someApp')
	    .controller('MainCtrl', function ($scope, FactoryName) {
                FactoryName.query().success().error();
            });


## 使用$resource封装Rest接口

如上所示$http基本可以满足对API接口调用的所有需求，$http提供的是一个非常低级的实现，但是具有非常好的灵活性。对于REST类型的API接口还提供了一个独立的可选模块ngResource。 该模块容许我们定义一个资源描述对象来代表响应的REST资源，通过面向对象的方式来操作响应的REST API接口。


使用$resource服务需要导入单独的[angular-reources.js](https://github.com/angular/bower-angular-resource)文件

用法：


    $resource(url, [paramDefaults], [actions]);


resource描述资源对象主要包含:资源URL地址(url);请求的方法(method);默认的参数，以及附属的其他方法，返回值是数组或者对象等信息（isArray）。

示例：

    var SomeResources = $resource('/api/resourfes/:id', null, {
       action1: {
         method: 'GET',
         url: 'someOtherUrl',
         isArray: true  
       }
    });

如上所定义的SomeResources对象包含resource提供的默认方法get(), save(), query(), remove(), delete()等默认方法，以及自定义的action1方法。

在调用过程中的映射关系如下：（$resources并未提供默认的put方法）

|           资源函数               | *方法*  |            地址                     |     *返回结果*  |
|---------------------------------|--------|------------------------------------|---------------|
| SomeResources.get({id: id})     |  GET   | http /api/resources/:id            |    JSON对象    |
| SomeResources.save({}, res)     | POST   | http POST /api/resources data=data |    JSON对象    |
| SomeResources.query()           | GET    | http /api/resources                |    JSON数组    |
| SomeResources.remove({id:id})   | DELETE | http DELETE /api/resources/:id     |    JSON对象    |

示例：


    angular.module('someApp')
        .factory('FactoryName', ['$resource', function($resource){
           return $resource('someUrl', null, {
               action1: {
                 method: 'GET',
                 url: 'someOtherUrl',
                 isArray: true  
               }
           });
        }]);
