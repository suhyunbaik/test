---
title: 파이선, 장고로 제프리 팔레르모의 'onion architecture' 구현해보기 
date: 2020-11-08
categories: [Architecture]
---


목차

1. 어니언 아키텍쳐 소개 
2. 어니언 아키텍쳐가 해결하는 문제  
3. 파이선, 장고로 구현한 어니언 아키텍쳐  
- Model, Service, View 구조
- model과 domain model
- service 와 application service, domain service
- 다이어그램과 코드 
4. DDD와 어니언 아키텍쳐와의 관계  
5. References





##### 어니언 아키텍쳐 소개 

어니언 아키텍쳐(onion architecture)는 2008년에 제프리 팔레르모가 만든 패턴 입니다. 어니언 아키텍쳐를 적용하기에 좋은 대상은 복잡한 기능이 많고 장기간 사용할 비즈니스 어플리케이션이며, 소규모 웹 어플리케이션에는 적합하지 않습니다. 이 아키텍쳐는 전통적인 계층적 아키텍쳐 (layered architecture)와 헥사고날 아키텍쳐(Hexagonal architecture)와 비슷한 부분이 많습니다. 계층적 아키텍쳐처럼 어니언 아키텍쳐도 계층이라는 단어를 사용하지만 의미는 약간 다르며, 3-tire 와 n-tier 아키텍쳐에 있는 문제점을 해결한 아키텍쳐입니다. 



![layered architecture](https://herbertograca.files.wordpress.com/2017/07/1980s-90s-layered-architecture.png?w=1100)

전통적인 레이어드 아키텍쳐를 표현한 다이어그램

전통적인 계층적 아키텍쳐는 계층(layer)으로 이뤄집니다. 각 계층은 자신보다 하위에 있는 계층에 의존합니다. 각 계층은 하위 계층만 호출할 수 있습니다다. 모든 계층은 소프트웨어에서 공통으로 사용하는 인프라나 유틸리티 서비스에 의존합니다. 

인프라, 유틸리티 서비스와 관련된 코드가 전 계층에 있기 때문에 모든 계층이 종국에는 뒤섞이면서 서로 강결합해버립니다. 이런 결합이 생기면, UI와 비즈니스 로직의 결합이 발생해 데이터 접근방식에 영향을 줍니다. 가장 흔히 발생하는 문제는 비즈니스 로직이 없어서 UI 도 없는 문제입니다. 데이터 접근 부분이 없어서 비즈니스 로직도 없는 경우도 생깁니다. 데이터 접근 방식은 업계 통상 2년마다 바뀌는데, 계층적 아키텍쳐가 적용된 소프트웨어라면 인프라와 강결합된 코드가 전 계층에 퍼져 있을테니 데이터베이스를 교체할때 비싼 유지보수 비용을 지불하게 됩니다.

제프리 팔레르모가 제안한 어니언 아키텍쳐는 위에 언급된 단점을 개선한 아키텍쳐입니다. 



##### 어니언 아키텍쳐가 해결하는 문제 

![onion architecture](https://i0.wp.com/jeffreypalermo.com/wp-content/uploads/2018/06/image257b0257d255b59255d.png?resize=366%2C259&ssl=1)

어니언 아키텍쳐의 주 관심사는 내부/외부 구획을 짓기와 결합의 조종입니다. 모든 코드는 해당 영역보다 더 중심부에 가까운 영역에 있는 요소에 의존할 수 있지만, 바깥으로 향하는 영역에 있는 요소에 의존하면 안됩니다. 각 계층은 서로 소통할때 인터페이스를 사용합니다. 어니언 아키텍쳐는 기존의 n-tier 아키텍쳐와는 다르게 데이터 계층에 의존하지 않습니다. 대신 도메인 모델 계층에 의존합니다. 

아키텍쳐 중심부에는 도메인 모델이 있습니다. 도메인 모델은 다른 무엇과도 결합하지 않습니다. 도메인 모델 계층, 도메인 서비스계층, 어플리케이션 서비스 계층을 포함하는 어플리케이션 코어는 여러 계층으로 나눠질 수 있습니다. 나누는 계층 갯수는 제한이 없습니다. 필요한대로 나누면 됩니다. 그러나 도메인 모델 계층은 반드시 중심에 있어야 합니다. 

오브젝트를 저장하는 행위는 어플리케이션 코어에 없다. 인프라인 데이터베이스와 연관성이 있기 때문입니다. 어플리케이션 코어에는 인터페이스만 있어야 합니다. 바깥 원은 자주 바뀌는 요소들을 위한 자리입니다. UI, 인프라, 테스트 등이 여기에 속합니다. 변화가 자주 일어나는 요소들은 반드시 어플리케이션의 코어에서 분리되어야 합니다. 이러한 요소들 중에는 데이터 접근 방식이 있습니다. 데이터 접근 방식은 통상 2년 단위로 크게 바뀌고 데이터베이스에 강하게 의존하기 때문에 분리되야 합니다. 데이터베이스도 소프트웨어 구성에서 외부에 속해야 합니다. 데이터베이스, 파일시스템, 등등을 어플리케이션에서 결합되지 않게해 어플리케이션 유지 보수 비용을 줄입니다. 

어니언 아키텍쳐의 각 계층을 간략해게 정리하자면 다음과 같습니다.

* 도메인 모델 계층: 도메인 오브젝트와 도메인 인터페이스가 있는 계층. 의존성이 없습니다.
* 도메인 서비스 계층: 도메인 모델 계층과 어플리케이션 서비스 계층을 연결합니다. 이 계층에서 오브젝트를 갖고오거나 저장하는 등, 데이터베이스와 연관된 작업을 수행하는 인터페이스를 둡니다. 
* 어플리케이션 서비스 계층: 어플리케이션 종속적인 비즈니스 로직이 있는 계층.  (예: usecase)
* 외부 계층: UI, 데이터베이스, 테스트와 같이 변화가 잦은 요소들이 있는 계층. 웹 어플리케이션일 경우에는 이 계층에 웹 API 또는 유닛 테스트가 있습니다. 이 계층은 인터페이스를 통해 내부 계층과 연결됩니다.

계층들은 서로를 감싸면서 양파같은 모양을 형성합니다. 어니언은 외부 계층은 하위 계층에 의존할 수 있지만, 하위 계층은 외부 계층에 있는 코드를 직접 호출할 수 없다는 의존성 규칙이 있습니다. 각 계층은 의존성 규칙에 따라서 상호작용합니다. 

어니언 아키텍쳐의 주 특징을 간단하게 4가지로 정리하면 다음과 같습니다.

* 어플리케이션은 독립적인 오브젝트 모델로 개발해야 합니다.
* 내부 원은 인터페이스를 정의한다. 외부 원은 인터페이스를 구현합니다.
* 결합 방향은 중앙을 향해야 합니다.
* 모든 어플리케이션 코어 코드는 인프라와 별개로 컴파일될 수 있고 실행될 수 있어야 합니다.





##### 파이선, 장고로 구현한 어니언 아키텍쳐 

카페에서 커피 주문을 받거나 고객의 주문을 관리하는 시스템을 어니언 아키텍쳐로 구현해보기로 합니다. 



- Model, Service, View 구조 

먼저 보통 파이선 장고 프로젝트를 시작할떄 흔히 사용하는  model, service, view 구조로 개발해보도록 합니다. 카페, 고객, 주문 모델링은 장고 ORM 으로 구현합니다. 

models.py

```python
from django.db import models


class Cafe(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)


class Customer(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)


class Order(models.Model):
    id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    cafe = models.ForeignKey(Cafe, on_delete=models.CASCADE)
  
```



카페에 커피를 주문하고, 주문을 관리할 수 있는 비즈니스 로직을 구현합니다. 카페와 고객의 아이디를 받아서 데이터베이스의 주문 테이블에 주문을 저장히고, 저장된 주문 데이터를 불러와 주문 객체로 만들어서 해당 객체를 가지고 비즈니스 로직을 수행해야 합니다. 데이터를 불러오거나 저장할때는 ORM을 사용합니다. ORM 을 사용하기 때문에 데이터 접근, 데이터 객체 변환 계층은 필요없다. ORM 이 그 역할을 동시에 수행합니다.

service.py

```python
class OrderCoffeeService:
    def order_coffee(self, cafe_id: int, customer_id: int):
        order = Order.objects.create(cafe_id=cafe_id, customer_id=customer_id)
        order.save()
    

class OrderService:
    def get_order(self, order_id: int) -> OrderDomainModel:
        order = Order.objects.get(order_id=order_id)
        return order
```



간단한 API를 작성합니다. API 는 service 에서 반환한 객체를 serializer 를 통해 직렬화 한뒤 외부에 반환합니다.

serializer.py

```python
from rest_framework import serializers

class OrderResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    cafe_id = serializers.IntegerField()
    customer_id = serializers.IntegerField()
```



views.py

```python
from django.http import HttpResponse, JsonResponse

from cafe.application_service import order_coffee_service, order_service
from cafe.serializer import OrderResponseSerializer


def order_coffee(request, cafe_id, customer_id):
    order_coffee_service.order_coffee(cafe_id, customer_id)
    return HttpResponse(status=200)


def get_order(request):
    order = order_service.get_order(order_id=1)
    serializer = OrderResponseSerializer(order)
    return JsonResponse(serializer.data)

```



보통 장고로 구현한 backend용 파이선 프로젝트는 위의 구조를 많이 사용하는 것 같습니다. 이제 위 코드를 어니언 아키텍쳐 다이어그램과 최대한 비슷하게 구현해봅시다.



- model 과 domain model

어니언 아키텍쳐 규칙에 따라 인프라와 연관된 코드를 다른 코드에서 분리해야 합니다. 여기서는 인프라 코드가 장고 ORM 입니다. ORM으로 작성한 model은 데이터베이스에 접근해서 데이터를 가져오는 용도로만 사용합니다. ORM으로 가져온 데이터는 객체상태로 존재하지만 해당 객체를 바로 쓰지 않습니다. 도메인 모델을 통해서 객체로 만듭니다.

domain_models.py

```python
from dataclasses import dataclass
from cafe.models import Order, Cafe, Customer


@dataclass
class CafeDomainModel:
    id: int
    name: str

    def __init__(self, id: int, name: str):
        self.id = id
        self.name = name

    @classmethod
    def of(cls, cafe: Cafe):
        return cls(id=cafe.id, name=cafe.name)


@dataclass
class OrderDomainModel:
    id: int
    cafe_id: int
    customer_id: int

    def __init__(self, id: int, cafe_id: int, customer_id: int):
        self.id = id
        self.cafe_id = cafe_id
        self.customer_id = customer_id

    @classmethod
    def of(cls, order: Order):
        return cls(id=order.id, customer_id=order.customer_id, cafe_id=order.cafe_id)

```



- service 와 application service, domain service

Service 계층은 2가지의 다른 작업을 동시에 수행합니다. 하나는 비즈니스 로직이고 또 하나는 객체를 가지고 수행하는 작업입니다. Cafe 또는 Order 객체를 갖고오거나 객체를 삭제, 수정, 저장하는 행위는 어니언 아키텍쳐에서 Object Service에 해당합니다. 주문을 조회하고 커피 주문을 하는 행위는 Application Service 입니다. 먼저 Object service 에서 사용할 추상클래스를 정의합니다.



object_service.py

```python
import abc

class ObjectService(abc.ABC):
    @abc.abstractmethod
    def get(self, pk: int):
        pass

    @abc.abstractmethod
    def save(self, arg):
        pass

```



추상클래스를 상속해 cafe object service 와 order object service를 구현합니다.

object_service.py

```python

class CafeObjectService(ObjectService):
    def get(self, cafe_id: int) -> Cafe:
        return Cafe.objects.get(pk=cafe_id)

    def save(self, cafe: Cafe) -> NoReturn:
        cafe.save()


class OrderObjectService(ObjectService):
    def get(self, order_id: int) -> Order:
        try:
            return Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            raise Exception('Order Does not exist')

    def save(self, order: Order) -> NoReturn:
        order.save()

```



비즈니스 로직이 있는 application service 는 이제 object service 로 비즈니스 로직을 수행합니다. 

application_service.py

```python
class OrderCoffeeService:
  def __init__(self, cafe_object_service: CafeObjectService)
  	self._cafe_object_service = cafe_object_service
    
  def order_coffee(self, cafe_id: int, customer_id: int):
    cafe = self.cafe_object_service.get(cafe_id)
    ...
    self._cafe_object_service.save(order)
    
    
class OrderService:
    def __init__(self, order_object_service: OrderObjectService = None):
        self.order_object_service = order_object_service

    def get_order(self, order_id: int) -> OrderDomainModel:
        order = self.order_object_service.get(order_id)
        return OrderDomainModel.of(order)
     
```



- 다이어그램 

![python_django_onion](https://suhyunbaik.github.io/images/posts/python_django_onion.png)

완성된 코드는 [여기서](https://github.com/suhyunbaik/python-django-onion) 확인할 수 있습니다.



##### DDD와의 관계

어니언 아키텍쳐와 DDD는 성취하려는 목표가 다릅니다. 어니언 아키텍쳐는 도메인과 비즈니스 로직을 데이터 접근, UI, 인프라와 같은 영역에 의존하지 않고 독립적인 영역으로 만드는 게 목표입니다. 그래서 어니언 아키첵쳐에서는 도메인 모델에 대한 설명이 적습니다. 대신 도메인을 보호하는 방법에 대해 설명하는데 많은 부분을 할애합니다. 다이어그램에서 볼 수 있듯이, 어플리케이션을 내/외부로 구획을 짓고 서로 결합하지 않도록 강력하게 관리하는 방법이 어니언 아키텍쳐의 주요 관심사입니다.

DDD는 도메인과 객체를 비즈니스 세계와 가장 가깝게 설계하고 비즈니스 세계와 코드상의 간극을 줄이는게 목표입니다. 도메인은 비즈니스 도메인과 직접적인 연관관계가 있어야 하며, 각 객체는 실제 환경에서 해당 객체가 상징하는 요소가 하는 행동과 동일한 행동을 해야 하고 동일한 규칙을 가져야 합니다. 어니언 아키텍쳐에서 Domain model, Domain Service 라고 부르는 영역을 설계하는 방법이 주요 관심사입니다.

어니언 아키텍쳐와 DDD를 한 어플리케이션에 사용한다면 각 아키텍쳐의 장단점을 적절하게 취할 수 있다는 생각이 듭니다. 어니언 아키텍쳐로 내/외부 부분을 확실하게 구분지어 의존성을 조절하고, DDD로 비즈니스에 가장 가까운 도메인 및 객체 설계를 한다면 좋을 것 같습니다.

현재 제트팀은 백엔드에 적용할 아키텍쳐를 검토 중입니다. 어니언 아키텍쳐도 논의 대상 중 하나이며, 향후 서비스에 이 아키텍쳐를 적용하는걸 기대해봅니다.





##### References

* https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/
* https://alistair.cockburn.us/coming-soon/
* https://jeffreypalermo.com
* https://www.infoq.com/news/2014/10/ddd-onion-architecture/