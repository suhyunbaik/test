---
title: Django 서버에서 동시접속자 증가시 502 발생 문제
layout: page
tags: [DevOps]
categories: [DevOps]
---
[1.문제](#1.문제)  
[2.uWSGI worker 갯수 증가](#2.uWSGI worker 갯수 증가)   
3.db connection pool 도입  
4.mysqlclient에서 pymyql 로 변경  
5.uWSGI 에서 gunicorn 으로 변경  


##### 1.문제

현재 문제가 있는 서버는 평균적으로 분당 1.9만의 리퀘스트를 소화하는데, 동시접속수가 증가하면 ELB 에서 502가 자주 발생한다. 대략 5분당 평균 13개의 502가 발생한다. 

Sever

* Python==2.7
* Django==1.11
* uWSGI==2.0
* mysqlclient

이 문제를 해결하려고 여러가지 시도를 해봤다.



##### 2.uWSGI worker 갯수 증가

기존 worker 갯수는 2개였다. 이전부터 이 worker 들은 `max-requests` 옵션에 지정된 리퀘스트를 소화한뒤 정상적으로 종료되는게 아니라, 갑자기 어디선가 발생한 `signal 9`을 받고 죽는 문제가 있었다. `signal 9` 이 발생하는 이유는 보통 메모리 부족인데, 파게이트 컨테이너 측정치를 봤을때는 메모리 사용량이 대체로 30%여서 메모리 문제는 아닌 것 같았다. 내 추측에는 아마 worker 가 2개 뿐이니 `max-request`에 지정된 리퀘스트 수 보다 더 많은 리퀘스트를 받아서 uWSGI에서 signal 9  을 발생시켜 worker 를 강제로 죽이고, worker 가 둘 다 죽어서 워커가 다시 respawn 될때까지 기다리는 상황이 빈번하게 발생하고, 이렇게 spawn된 worker가 없을때 들어온 리퀘스트가 502가 발생한다고 생각했다. 이러한 상황을 방지하기 위해서 `max-requests-delta` 옵션이 있지만 효과가 없는 것 같았다. (나중에 알게 되었는데 `max-requests-delta` 옵션은 `uWSGI >= 2.1` 부터 효과가 있다고 한다.) 그래서 스테이징에 worker 수를 증가시켜 테스트를 했는데 2, 4, 6개였을때는 별 차이가 없었지만 8, 12, 16 등등 수를 크게 증가시킬수록 500대 에러 발생률이 크게 낮아졌다. `signal 9` 문제도 더이상 발생하지 않았다. 

그런데 worker 수를 증가시키지 말자는 의견이 있어서 이 방법은 가장 마지막에 시도할 해결방법으로 제쳐두었다. 반대 이유는 보통 이상적인 worker 갯수 산정을 `core x 2` 로 계산하기 때문에, worker 수가 너무 낮게 잡혀있는건 맞지만, 워커 갯수를 12, 15 정도로 증가시킬거라면 그냥 파게이트 컨테이너를 1대 더 띄우는게 낫다는 이유였다.



##### 3. db connection pool 도입

uWSGI 에서 몽키 패치를 해도 디비 커넥션이 병목현상이 디비 커넥션에서 일어난다고 생각했다. 그래서 `sqlalchemy` 디비 커넥션 풀링을 도입해서 스테이징에서 테스트 했다.
![db connection with pooling](/images/posts/db_connection_with_pooling.png)  
커넥션 풀링 도입 전과 후과 다르다. 그러나 동시접속자 수가 증가하면 여전히 502가 발생했다.



##### 4. mysqlclient 에서 pymysql 로 변경

uWSGI 에서는 gevent 쓰려면 몽키패치를 해야한다. 몽키패치는 pure python 에서만 효과를 발휘하는데, 현재 사용하고 있는 mysqlicent 는 cpython 이라서 몽키패치가 안된다. 결국 gevent 를 100개 spawn하더라도, mysqliclient가 몽키패치 되지않아 gevent 1개가 끝날때까지 나머지가 블로킹 될거고 이 부분이 병목이 된다는 생각이 들었다. pymysql은 pure python 이지만 mysqlclient 에 비교하면 성능이 60%나 떨어진다고 한다. 그러나 성능이 떨어지더라도 몽키패치가 되면 성능이 상쇄될거라고 생각해서 pymyql 로 변경했다.



##### 5. uWSGI 에서 gunicorn 으로 변경

pymysql 로 라이브러리를 변경 한 뒤에 uWSGI 의 몽키패치가 효과가 있었지만, 동시접속사 수 문제에서는 여전히 큰 효과가 없었다. 그리고 uWSGI 를 잘쓰려면 학습해야하는데 우선 피쳐 개발이 급해서 학습할 시간이 없고, 대략 gunicorn 성능이 더 좋다고 해서 gunicorn 옮기기로 결정했다. 아래는 gunicorn 으로 변경 후 500대 에러의 변화다.
![gunicorn deploy](/images/posts/gunicorn_deploy.png)  








##### References 

*[avoid all workers get respawned](https://stackoverflow.com/questions/48977889/avoid-that-all-workers-get-re-spawned-at-the-same-time)
*[pymysql evalution](https://wiki.openstack.org/wiki/PyMySQL_evaluation)