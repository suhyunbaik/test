---
title: "Sentry를 Ubuntu에 self-hosted로 구축하기"
date: "2020-01-05"
---

updated: 2020-01-08

[Sentry](https://sentry.io/welcome/)는 소스가 github에 공개되어있어서, 직접 구축해 사용할 수 있다. 여기서는 우선 도커를 사용해 구축하는 방법을 정리했다.

1. 도커 설치
2. 도커 컴포즈 설치
3. 센트리 도커 프로젝트 받기
4. GeoIp 설정
5. install.sh 로 센트리 실행

###1. 도커 설치

AWS EC2 ubuntu instance를 런칭한 후 접속한다.

먼저 기존의 패키지들을 업데이트 해준다. 

```shell
sudo apt update
```



`apt` 패키지를 HTTPS로 설치할 수 있게 도와주는 패키지들을 설치한다.

```shell
sudo apt install apt-transport-https ca-certificates curl software-properties-common
```



공식 도커 리포지토리에 GPG Key 를 등록한다.

```shell
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
```



APT 소스에  도커 리포지토리를 추가한다. 

```shell
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
```



도커를 설치한다.

```shell
sudo apt install docker-ce
```



도커가 설치됐는지 실행해본다.

```shell
sudo systemctl status docker
```

Output

```shell
● docker.service - Docker Application Container Engine
   Loaded: loaded (/lib/systemd/system/docker.service; enabled; vendor preset: enabled)
   Active: active (running) since Fri 2020-01-03 08:02:17 UTC; 45min ago
     Docs: https://docs.docker.com
 Main PID: 3360 (dockerd)
    Tasks: 8
   CGroup: /system.slice/docker.service
           └─3360 /usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock

Jan 03 08:02:17 ip-192-168-0-55 dockerd[3360]: time="2020-01-03T08:02:17.090217516Z" level=warning msg="Yo
Jan 03 08:02:17 ip-192-168-0-55 dockerd[3360]: time="2020-01-03T08:02:17.090478324Z" level=warning msg="Yo
Jan 03 08:02:17 ip-192-168-0-55 dockerd[3360]: time="2020-01-03T08:02:17.090621788Z" level=warning msg="Yo
Jan 03 08:02:17 ip-192-168-0-55 dockerd[3360]: time="2020-01-03T08:02:17.090940760Z" level=info msg="Loadi
Jan 03 08:02:17 ip-192-168-0-55 dockerd[3360]: time="2020-01-03T08:02:17.339110960Z" level=info msg="Defau
Jan 03 08:02:17 ip-192-168-0-55 dockerd[3360]: time="2020-01-03T08:02:17.475207558Z" level=info msg="Loadi
Jan 03 08:02:17 ip-192-168-0-55 dockerd[3360]: time="2020-01-03T08:02:17.516353882Z" level=info msg="Docke
Jan 03 08:02:17 ip-192-168-0-55 dockerd[3360]: time="2020-01-03T08:02:17.516788243Z" level=info msg="Daemo
Jan 03 08:02:17 ip-192-168-0-55 systemd[1]: Started Docker Application Container Engine.
```



##### 2. 도커 컴포즈 설치

도커 컴포즈를 설치한다.

```shell
sudo apt  install docker-compose
```

도커 컴포즈가 정상적으로 설치됐는지 확인하기 위해 버전을 확인한다.

```shell
docker-compose version
```



##### 3. 센트리 도커 프로젝트 받기

센트리 도커 프로젝트를 받아야 한다. 폴더를 생성한다.

```shell
sudo mkdir sentry
```

해당 폴더 내에서 프로젝트를 클론한다.

```shell
cd sentry
git clone https://github.com/getsentry/onpremise .
```



##### 4. GeoIP 설정

센트리를 사용하려면 [GeoIp](https://www.maxmind.com/en/geoip-demo)가 필요하다. 만약 GeoIp 데이터베이스가 이미 있다면 센트리 설정 파일에서 패스를 잡아주면 된다.  나는 센트리 프로젝트 폴더에 GeoIP 데이터베이스를 넣어주고 거기로 패스를 잡았다. `sentry.conf.py`  에서 `GEOIP_PATH_MMDB = '../GeoIP.dat'` 를 추가한다.



##### 5. Install.sh 로 센트리 실행

센트리를 사용하려면 다음과 같은 서비스가 필요하다.

* Redis
* [Postgresql](postgresql)
* [Zookeeper](zookeeper)
* [Kafka](https://getsentry.github.io/symbolicator/)
* [Clickhouse](https://clickhouse.yandex)
* [Symbolicator](https://getsentry.github.io/symbolicator/)

도커 컴포즈로 프로젝트를 실행하면, 해당 서비스들을 external로 연결하기 때문에 먼저 데이터볼륨을 생성하라는 에러 메세지를 준다.

```shell
sudo docker-compose up -d
```

Output

```shell
ERROR: Volume sentry-symbolicator declared as external, but could not be found. Please create the volume manually using `docker volume create --name=sentry-symbolicator` and try again.
```

external로 연결하는 데이터 볼륨들은 `docker-compose.yml`에 명시되어 있는데, 명령어를 쳐서 만드는 것보다 가장 빠른 방법을 선택한다. 센트리 프로젝트 내의 설치 스크립트를 실행시킨다. 

```shell
./install.sh
```

스트립트를 실행하면 자동으로 db 마이그레이션까지 진행한다. 진행 중에 admin 계정 생성을 위해서 아이디와 이메일, 비밀번호를 입력해야 하는 과정이 있다.

모든 과정이 끝나면 도커 컴포즈 명령어로 실행한다.

```shell
sudo docker-compose up -d
```

`ctop` 또는 `sudo docker ps`  로 컨테이너가 떠있는지 확인한다. 센트리를 실행하는 데 문제가 없다면, 인터넷 브라우저 창에서 `127.0.0.1:9000` 을 입력해 센트리로 접속할 수 있다. 아까 생성했던 admin 계정으로 로그인을 한다.



* 데이터 볼륨

docker-compose.yml 을 보면 데이터 볼륨들이 명시되어있다. 

docker-compose.yml

```docker
volumes:
  sentry-data:
    external: true
  sentry-postgres:
    external: true
  sentry-redis:
    external: true
  sentry-zookeeper:
    external: true
  sentry-kafka:
    external: true
  sentry-clickhouse:
    external: true
  sentry-symbolicator:
    external: true
```



데이터 볼륨이란?

> Docker 데이터 볼륨은 데이터를 컨테이너가 아닌 호스트에 저장하는 방식입니다. 따라서 데이터볼륨은 컨테이너끼리 데이터를 공유할 때 활용할 수 있습니다.
>
> Docker 컨테이너 안의 파일 변경 사항은 Union File System에 의해 관리됩니다. 하지만 데이터 볼륨은 Union File System을 통하지 않고 바로 호스트에 저장됩니다. 따라서 `docker commit` 명령을 통해 이미지로 생성해도 데이터 볼륨의 변경 사항은 이미지에 포함되지 않습니다.
>
> http://pyrasis.com/book/DockerForTheReallyImpatient/Chapter06/04





### References
* https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-18-04
* https://medium.com/sentry-with-docker/installing-sentry-with-docker-c1d83dfee577
* https://github.com/getsentry/onpremise