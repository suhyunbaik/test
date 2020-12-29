---
title: 장고, EC2 Fargate 사용시 ALLOWED HOST 문제 + 조언은 어떻게 하는게 가장 효율적일까?
layout: page
tags: [DevOps, Django, EC2 Fargate]
categories: [DevOps]
---

목차

1. 문제
2. 원인 추측
3. 해결
4. 개선



##### 1. 문제

과거 스테이징 서버는 EC2 Instance 를 사용하고, OpsWorks 로 배포한다. 이걸 Fargate 로 바꾸자는 요구가 있어서 서버를 새로 구성하게 됐다. 도커파일을 작성해 ECR에 이미지를 올리고, Fargate에 배포하는건 빠르게 끝냈다. 새로 구성한 ELB 주소도 ALLOWED HOST 에 추가했다. 그런데 리퀘스트를 보내면 ALLOWED HOST 에서 막히는 문제가 발생헀다.



##### 2. 원인추측

프로젝트는 nginx, uwsgi, django 로 구성되어 있다. 그런데 도커 파일에는 uwsgi 만 사용한다. 그래서 리퀘스트를 바로 uwsgi 가 받아서 컨테이너 내부 도커에 전달할때, 해당 리퀘스트가 어디에서 왔는지 (ELB) 정보가 없어서 막히는것이라고 생각헀다. 이때까지만 해도 리퀘스트 출발 정보를 보존해서 uwsgi 에 전달하는게 nginx 에만 있는 기능이라고 생각헀다.

-> nginx 를 추가했지만 동일한 문제가 발생헀다.



nginx 를 추가했지만 동일문제가 계속 발생했다. 그래서 두번째로 한건 nginx - uwsgi 가 서로 소켓 통신하도록 바꿔준것이다. 

-> 물론 문제와 전혀 상관없는 부분이였기 때문에 동일 문제는 계속 발생했다. 그 전에는 http 통신을 하도록 되어있었으니 만약 계속 소켓 통신하도록 했다면 속도는 아주 조금 빨라졌지 않았을까? 다시 생각해보니 별로 티도 안났을것 같다. 결국 다른 사람이 http 통신하게 바꾸라고 해서 바꿨다.



파게이트의 ip를 주소를 직접 넣어줘야 겠다는 생각을 했다. 그런데 파게이트 컨테이너는 aws vpc 네트워크 모드에서 돌아가고 있고, 컨테이너가 새로 뜰 때 마다 ip 주소가 바뀐다. 그렇다면 django ALLOWED HOST에서 가능한 대역폭을 전부 넣어줘야한다. 그런데 장고에 대역폭을 허용하는 기능이 있는지 모르겠다. 그래서 stack overflow를 뒤졌다. 알게된건 사람들이 가능한 ip 주소를 전부 생성해서 ALLOWED HOST 리스트에 추가하는 방법으로 해결하고 있다는 사실을 알게됐다. 이 방법을 선택할 수 도 있지만 사실 필요한 ip 주소는 한개인데, 모든 ip 주소를 생성해서 넣어주는 부분이 내키지 않았다.



##### 3.해결

stack overflow에서 발견한 해결책은 이렇다. ECS 컨테이너는 환경변수에 해당 컨테이너의 IPv4 address를 추가하기 때문에 그걸 갖고와서 ALLOWED HOST에 추가해주면 된다.

```python
import requests

EC2_PRIVATE_IP = None
METADATA_URI = os.environ.get('ECS_CONTAINER_METADATA_URI', 'http://169.254.170.2/v2/metadata')

try:
    resp = requests.get(METADATA_URI)
    data = resp.json()
    # print(data)

    container_meta = data['Containers'][0]
    EC2_PRIVATE_IP = container_meta['Networks'][0]['IPv4Addresses'][0]
except:
    # silently fail as we may not be in an ECS environment
    pass

if EC2_PRIVATE_IP:
    # Be sure your ALLOWED_HOSTS is a list NOT a tuple
    # or .append() will fail
    ALLOWED_HOSTS.append(EC2_PRIVATE_IP)
```



왜 컨테이너를 사용할떄는 ALLOWED HOST에 IP 주소를 추가해야 할까? ECS 에이전트는 작업정의의 컨테이너에서 각 작업을 위한 '정지' 상태의 컨테이너를 만든다. 그러고 난 후 '정지' 컨테이너를 위해서 네트워크 네임스페이스를 세팅하고, 작업 내 다른 컨테이너도 시작해 정지된 컨테이너와 같은 네트워크를 공유하게 만든다. 그래서 컨테이너에 IPv4 주소를 추가만 해주면 문제가 해결되는 것이다. 



##### 4. 개선

내가 문제를 발견했을 때 먼저 stack overflow 를 뒤졌다면, 문제를 빠르게 해결했을 것이다. 나는 검색을 하기 전에 먼저 조언을 구했는데, 내가 받은 조언은 '..해당 문제의 원인은  당신의 http 네트워크에 대한 이해가 부족해서 발생하는 문제..' 였다. 이 말을 들은 순간부터 웹에 검색을 해 볼 생각을 못했고, 급한 마음에 책이나 뒤지면서 시간을 다 흘려보냈다. 이렇게 해서 꽤 많은 시간을 이 문제 해결에 버렸다.

서버 개발자는 네트워크 지식은 기본적으로 갖고 있어야 하고, 계속 공부하는 게 맞다. 하지만 문제 상황에서 해결을 위한 조언으로는 적절하지 못했다. 왜냐면 해당 문제를 해결하는데만 많은 시간을 써버렸고 그만큼 피쳐 개발에 시간을 덜 쓸 수 밖에 없었기 때문이다. 만약 다른 팀원이 같은 문제를 맞닥트렸다면, 어떤 방법이 가장 좋은 방법인가? 내가 생각하는 가장 좋은 방법은 우선 먼저 문제해결을 하고, 그 후에 회고나 복기를 통해서 문제 해결 방법을 짚어보면서 네트워크 지식을 쌓자고 얘기하는 방법이다. 이렇게 하면 문제 해결을 빠르게 할 수 있으니 버리는 시간 없이 바로 다른 것들을 개발할 수 있고(회사 입장에서는 좋다), 또한 문제 해결방법을 복기함으로서 자연스럽게 본인의 부족한 부분도 알 수 있기 때문이다.



##### References

* https://stackoverflow.com/questions/49828259/when-deploying-django-into-aws-fargate-how-do-you-add-the-local-ip-into-allowed