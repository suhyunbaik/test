---
title: 파이선으로 개발한 프롭테크 서비스 DDD 구조로 리팩토링
layout: page
tags: [DDD]
categories: [DDD]
---

목차  

서비스를 context 로 분리하고 django app으로 구분  
view, service, repository, model 로 분리  
IoC Container 구현  
부분적 경계를 facades 로 구현  
밸류 오브젝트를 엔티티로 변경  
후기


깃허브 https://github.com/suhyunbaik/buba-service  
몇년전에 프롭테크 서비스를 개발했었다. 사업적인 문제로 서비스를 접었는데 최근에 코드를 다시 살펴보니 개선할 부분이 많았다. 그 당시 서비스를 개발할때는 팀 내에 도메인 전문가가 없었고 구조에 대한 고민을 미처 못했다. 이번에는 리팩토링을 하면서 DDD를 적용해보기로 했다. 이 서비스는 프롭테크 서비스 이지만 직방, 다방과 타켓층이 다르다. 직방, 다방은 집을 알아보는 임차인이 타켓이지만, 이 서비스는 공인중개사가 타켓이다. 공인중개사의 업무 효율을 높이고 본인이 갖고있는 매물의 특징과 정보를 분석해서 영업에 도움이 되는 게 이 서비스의 목표다. 



서비스를 context 로 분리하고 django app으로 구분

![context_map](/images/posts/context_map.png)  

기존 코드는 기능별로 경계가 없어서 마치 큰 진흙덩어리처럼 기능이 서로 단단하게 강결합 된 상태다. 코드를 분리하기 위해서 먼저 서비스를 정리한다. 해당 서비스의 기능은 크게 매물 관리, 고객관리, 공동중개망, 문자 서비스, 공인중개사 관리로 나눌 수 있다. DDD 에서 말하는 bounded context 로 서비스를 나눠보자면 customer(고객), listing(매물), sms(문자), realtor(공인중개사)로 나눌 수 있다. 여기서 매물 관리는 product(공간정보), listing(매물) 이라는 2개의 bounded context 로 나눈다. 그리고 listing(매물) 이라는 context 에는 multiple listing(공동중개망) 이라는 aggregate 을 만든다.  매물관리를 이렇게 나눈 이유는 밑에 나온다.



* view, service, repository, model 로 분리 

기존 코드는 장고 공식문서에 설명하는 MVT(model view, template) 패턴을 따랐기 때문에 views.py 에 비즈니스 로직이 있었다. 이번에는 DDD를 적용하기로 했으므로, DDD에 맞춰서 코드를 나눈다. view는 요청을 받고 serialize, deserilaizer를 수행하며, 클라이언트에게 응답을 준다. service 는 여러 서비스와 리포지토리를 가지고 비즈니스 로직을 수행한다. repository 는 model 에서 밸류 오브젝트를 갖고온다. model 은 장고 내부 인프라 레이어와 연결되고, 그대로 RDS DB와 연결된다. 한개의 app은 4개 레이어 계층으로 구성한다. 



```python
# views
class RealtorMyselfView(APIView):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    service = container.get(name='realtor_service')

    def get(self, request):
        realtor = self.service.get_realtor(request.user.id)
        serializer = RealtorSerializer(realtor)
        return JsonResponse({'data': serializer.data})

```



```python
# services 
class RealtorService:

    def __init__(self, realtor_repository=None):
        self.realtor_repository = realtor_repository

    def get_realtors(self) -> Realtor:
        return self.realtor_repository.get_all_realtors()

    def get_realtor(self, user_id: int) -> Realtor:
        return self.realtor_repository.get_realtor_by_realtor_id(user_id)

    def register_realtor(self, data: SignUpRequestSerializer.data) -> NoReturn:
        self.realtor_repository.create_realtor(username=data['username'], password=data['password'], name=data['name'],
                                               email=data['email'], phone_number=data['phone_number'])

```



```python
# repository

class RealtorRepository:
    realtor_dao = Realtor.objects

    def get_all_realtors(self) -> Realtor:
        return self.realtor_dao.all()

    def get_realtor_by_realtor_id(self, user_id: int) -> Realtor:
        return self.realtor_dao.get(id=user_id)

    def create_realtor(self, data: SignUpRequestSerializer.data) -> NoReturn:
        self.realtor_dao.create_user(username=data['username'], password=data['password'], name=data['name'],
                                     email=data['email'], phone_number=data['phone_number'])

```



```python
# models
class Realtor(AbstractBaseUser, PermissionsMixin):
    REQUIRED_FIELDS = ['phone_number']
    USERNAME_FIELD = 'username'

    class Meta:
        verbose_name = verbose_name_plural = '공인중개사'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=40, unique=True, verbose_name='아이디')
    name = models.CharField(max_length=50, verbose_name='이름')
    ...
    objects = RealtorManager()

```  





* IoC Container 구현  

![container](/images/posts/container.png)  

해당 서비스를 개발할때 초반에는 어려움이 없었는데, 후반으로 갈수록 기능이 다양해지고 복잡도가 증가하면서 circualr import 처럼 잘못된 설계에서 기인하는 문제가 계속 터져서 고통을 겪었었다. 그 때 당시에는 의존성도 관리대상이라는 사실을 몰랐기 때문에 개발하다보니 import 에 import 가 꼬리를 물었고 이게 에러를 발생시켰다. 이번에는 의존성을 제어하기 위해 스프링 프레임워크를 참조했다. 

스프링 프레임워크에는 객체의 생성 및 생명주기를 관리하는 IoC 컨테이너가 있다. 스프링으로 프로덕션 개발을 한 경험이 없어서 깊이있게 알지 못하지만, 내가 아는 바로는 앱이 실행될때 컨테이너가 떠서 미리 필요한 객체들을 생성하고 이 객체들은 빈이라고 부르며, 자바 어노테이트를 사용해 미리 생성할 객체를 등록할 수 있다고 알고 있다. 장고에는 컨테이너가 없고 객체 등록용 어노테이트가 없기 때문에 직접 만들어서 써야한다. 각 앱마다 컨테이너를 1개씩 만들고, 컨테이너 클래스가 인스턴스화 되면 해당 앱에서 사용하는 객체들을 생성해서 들고있도록 한다. 의존성 주입 방법은 스프링에서는 setter, method, constructor 3가지 방법이 있는데, 이 프로젝트에서는 constructor 방식만 사용했다.



```python
class Container:
    def __init__(self):
        self.deps = {}

    def register_all(self):
        self.deps['realtor_repository'] = RealtorRepository()
        self.deps['realtor_service'] = RealtorService(self.deps['realtor_repository'])

    def get(self, name):
        component = self.deps.get(name)
        if not component:
            raise ValueError(f'{name} instance does not exists')
        return component


container = Container()
container.register_all()

```


* 부분적 경계를 facades로 구현 

![facades](/images/posts/facades.png)  


가끔은 다른 bounded context에 있는 service에 접근할 필요한 경우가 있다. 해당 서비스에서는 customer 앱에서 listing 앱에 접근해 해당 customer가 관심을 보였던 매물정보를 갖고오는 기능이 있다. 클린 아키텍쳐 책 24장에서는 부분적 경계 구현 방법으로 크게 3가지를 제시하고 있는데, 첫번째는 단계를 건너뛰기, 두번째는 일차원 경계(boundary interface 사용), 세번째는 퍼사드 패턴을 이용하는 방법이다. 이 중에서 퍼사드를 사용하는 방법을 선택했다. 
고객 상세 정보를 들고오는 API 는 고객이 보고 간 매물 정보도 같이 보여준다. 매물 정보는 매물 컨텍스트 안에 있기 때문에 다른 django app 으로 분리되어있다. customer service 에서 listing service 로 직접 접근하지 않고, listing facades 를 만들어서 파사드를 통해 리스팅 컨텍스트에 접근한다. 이런 방법을 쓰면 실수로 다른 개발자가 listing service 의 메소드를 수정했을 경우 다른 api 가 영향 받는 범위를 줄일 수 있고, listing app 을 MSA로 만들 경우 facade 는 다른 서버와 통신하는 부분으로 만든다.  

```python
# views 
def get(self, request, customer_id):
    customer = self.service.get_customer_detail(customer_id)
    serializer = CustomerDetailResponseSerializer({'customer': customer, 'listings': customer.favorites})
    return JsonResponse(serializer.data)

# services
class CustomerService:

    def __init__(self, customer_repository=None, listing_facades=None):
        self.customer_repository = customer_repository
        self.listing_facades = listing_facades

    def get_customer_favorites(self, customer_id: int):
        return self.listing_facades.get_customer_favorites(customer_id)
    
# facades 
class ListingFacades:
    def __init__(self, listing_service=None):
        self.listing_service = listing_service

    def get_customer_favorites(self, customer_id: int):
        return self.listing_service.get_customer_favorites(customer_id)

```

* 밸류 오브젝트에서 엔티티로 변경  

서비스를 개발하다가 사용자수가 어느정도 늘어나면서 유저가 본인이 사용하고 싶은 기능을 요구하는 경우도 있었는데, 기존 서비스의 구조와 맞지않거나 기능 개발에 필요한 시간이 많다는 이유로 개발하지 않고 그냥 지나간 경우가 있었다. 코드를 다시 뜯어보고 나니, 잘못된 모델링 때문에 이런저런 이유로 기능을 개발하지 못한 경우가 대부분이다. DDD에서 말하는 엔티티, 밸류 오브젝트에 대한 개념이 잡혀있었다면 저지르지 않았을 실수가 많이 보였다.

* 공간정보과 거래형태를 분리하고 거래형태를 밸류 오브젝트에서 엔티티로 변경 

![product](/images/posts/product.png)  
 가장 큰 실수는 공간에 대한 정보를 매물의 밸류 오브젝트로 모델링한 실수다. 당시에는 매물정보(전월세, 가격 등등 거래형태에 대한 정보)만 필요하다고 생각했고 공간정보(부동산 종류, 위치 등등)는 밸류 오브젝트라고 생각했다. 그런데 당시 서비스 유저가 해당 공간에 대한 내역이 쌓이는 기능을 원한다고 애기했을때 구현하기가 상당히 어려워졌다. 그래서 이번에는 매물과 공간정보를 분리하고 둘다 엔티티로 모델링 헀다. 예를 들어 대성 빌라 202동 101호 20평 전세 4억 매물이 있다면 대성빌라 202동 101호 20평은 product context 의 product entity 가 되고, 전세 3억은 listing context 의 listing entity 가 된다. product entity 는 listing entity 와 파트너 관게를 맺고, listing entity 는 customer 와 realtor entity 와 관계를 맺는다. 

* 공인중개사와 공인중개사 사무소를 분리하고 사무소를 밸류 오브젝트에서 엔티티로 변경 

부동산 거래 경험이 없거나 공인중개사의 근무형태를 잘 모르는 사람들은 공인중개사의 근무 형태가 회사의 일반적인 정규직 형태와 같을 거라고 생각한다. 예를 들면, 공인중개사A 는  A 사무소를 차려서 거기에만 근무한다고 생각한다. 이런 생각과 다르게 공인중개사의 근무형태는 다양하다. 공인중개사 A가 B,C,D 사무소를 동시에 운영하는 경우도 있고, 공인중개사 B가 공인중개사 A의 사무소 A에 월,화 만 출근하고 공인중개사 C의 E사무소에 수, 목, 금요일만 출근하는 등 다양한 근무형태를 보인다. 

이런 사실을 모르고 개발했을때는 공인중개사를 엔티티, 공인중개사 사무소를 밸류 오브젝트로 간주했다. 이럴 경우 프롭테크 서비스를 사용하는 공인중개사 A가 본인 사무소 A가 아닌 다른 사무소 B 에 가서 서비스를 사용하려고 할 때 문제가 발생한다. 그래서 공인중개사와 공인중개소를 독립된 엔티티로 모델링한다. 

* 고객과 고객의 정체성을 분리하고 정체성을 밸류 오브젝트에서 엔티티로 변경  

![customer](/images/posts/customer.png)  
이 서비스에는 공인주개사무소를 방문했던 고객 정보를 입력해서 보는 기능이 있다. 당시 개발 할때는 고객 A가 원룸, 월세 매물을 문의하는 임차인일 경우만 상정했기 때문에 고객이라는 엔티티에 고객의 정체성은 밸류 오브젝트가 됐다. 그러나 현실 세계에서 고객은 계속 임차인이거나 임대인으로만 정체성을 유지하지 않는다. 고객B 는 A 공인중개사무소를 방문할때마다 계속 정체성이 계속 바뀐다. 몇 개월 전에는 빌라 매물을 구매할 의향이 있는 매수인이였지만, 지금은 빌라 매물을 전세로 시장에 내놓으려는 임대인이면서 동시에 다른 지역의 아파트 전세 매물을 알아보는 임차인이다. 미래에는 빌라 매물을 매도하고 아파트를 구매하려는 매도인 겸 매수인이 될지도 모른다. 고객의 정체성을 정리하면, 고객A는 시간의 흐름에 따라 매수인, 임대인, 임차인, 매도인, 매수인으로 변한다. 과거의 구조에서는 고객 A는 한개의 정체성만 갖고 있을 수 있어서 매수인A, 임대인 A, 임차인 A, 매도인 A, 매수인 A를 별개의 고객으로 간주했다. 이런 구조는 공인중개사의 업무에도 도움이 안된다. 고객 A의 과거 방문의도 및 내역을 알 수 없기 때문이다.

그래서 이번에는 고객과 고객 정체성 모델을 분리했고 둘다 엔티티로 본다. 이제부터 고객 A는 메수인, 임대인, 임차인 등등 다양한 정체성을 가질 수 있다. 



후기

에릭 에반스 책 DDD 에서는 DDD를 하기 위해서 도메인 전문가가 팀에 있어야 한다고 말한다. 이 서비스를 개발하면서 팀원중에는 꼭 도메인 전문가가 있어야 한다는 생각이 들었다. 해당 분야에 대한 기본 지식이 있었다면 모델링을 할때 실수를 줄일 수 있을거라고 생각했다. 코드를 다시 읽어봤을때 대부분의 문제는 서비스 특성상 엔티티로 봐야 하는 개념들을 밸류오브젝트로 모델링 했거나, 그 반대로 모델링 하는 등의 문제였기 때문이다. 

그리고 대부분의 DDD 나 설계 관련 책이 자바로 되어있어서 그런지 파이선 커뮤니티에서는 아키텍쳐에 대한 논의가 별로 없어보인다. 경험이 많진 않지만 이런 저런 서비스를 개발 및 운영해본 결과, 초반에는 그냥 개발해도 되지만 서비스가 발전하면 복잡도를 감당하기 위해서 설계가 필요하다. 장고, 플라스크 두 프레임워크에서 컨테이너나 의존성 관계 관리 등의 기능을 제공하지 않아 DDD를 하기가 불편한데 나중에는 이런 기능을 지원하지 않을까 생각한다.

