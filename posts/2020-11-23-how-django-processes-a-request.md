---
title: "번역 | 장고에서 리퀘스트를 처리하는 방법"
date: "2020-11-23"
--


1. 신호수신  
2. 핸들러의 작동  
3. 리퀘스트 처리 시작  
4. 미들웨어 처리 1  
5. 레솔루션 타임  
6. 미들웨어 처리 2  
7. 뷰(View)  
8. 응답시간(Response time)  
9. 미들웨어 처리 3: 예외   
10. 무응답  
11. 미들웨어 처리 4: 마지막 단계  
12. 응답



[How Django processes a request](https://www.b-list.org/weblog/2006/jun/13/how-django-processes-request/) 번역글입니다.



##### 1. 신호 수신

2가지 방법으로 장고 앱을 invoke한다.

1 아파치/모드파이선(apache/mod_python) 서버가 셋업되어있을 경우, 모드 파이선이 리퀘스트를 장고에게 전달하고 `django.core.hanlders.modpython.ModPythonHandler` 인스턴스를 생성한다.

2 `WSGI`를 준수하는 다른 요소일경우 장고 `django.core.handlers.wsgi.WsgiHandler` 인스턴스를 생성한다.



##### 2. 핸들러의 작동

핸들러가 인스턴스화 되면, 다음과 같은 과정을 거친다.

1. 핸들러가 장고 세팅 파일을 임포트한다. 

2. 장고의 커스텀 익셥센 클래스를 임포트한다. 

3핸들러는 자체 `load_middleware` 메소드를 호출하고, 해당 메소드는 세팅파일의 `MIDDLEWARE_CLASSES` 에 나열된 미들웨어 클래스들을 불러온다. 

미들웨어는 4가지 상태에 대한 후킹이 가능하다. (`process_request`, `process_view`, `process_response`, `process_exception`) 핸들러가 미들웨어를 검사할때는 메소드 이름으로 검사한다. 



##### 3. 리퀘스트 처리 시작

리퀘스트를 처리할 준비가 다 됐기 때문에, 시그널 `request_started` 를 디스패칭한다. 모드 파이선과 WSGI 가 리퀘스트를 다르게 처리하기 때문에 모드 파이선일 경우 `django.core.handlers.modpython.ModPythonRequest` 를, WSGI 일 경우에는 `django.core.hanlders.wsgi.WSGIRequest` 라는 클래스를 사용한다. `HttpRequest` 가 전달되면 핸들러가 `get_response`  메소드를 호출하고, `HttpRequest` 를 인자로 전달한다.



##### 4. 미들웨어 처리 1

`get_response` 는 핸들러의 `_request_middleware` 인스턴스 변수를 순회하면서 리스트 내 각 메소들르 호출해 `HttpRequest` 인스턴스를 아규먼트로 전달한다. 이 메소드들은 처리 과정을 무시하고 바로  `get_response` 를 반환할 수 있는 옵션이 있다. 만약 메소드 중 하나가 바로 반환을 한다면, 메인 핸들러 코드로 돌아가고 남은 미들웨어 클래스는 무시한다.



##### 5. 레솔루션 타임

미들웨어중 어느것도 리스폰스를 즉시 반환하지 않았다면, 핸들러는 요청된 URL를 분석한다. 핸들러는 세팅 파일에 있는 `ROOT_URLCONF` 를 읽고,  `django.core.urlresolvers.RegexURLResolver` 인스턴스를 만든 뒤 해당 인스턴스의 `resolve` 메소드를 호출한다.

만약 매칭되는 url 이 없다면 `django.core.urlresolvers.Resolver404` 예외를 발생시킨다.



##### 6. 미들웨어 처리 2

뷰 함수가 사용된다면 핸들러가 `_view_middleware` 리스트에 있는 메소드르 호출해 `HttpRequest` 를 전달한다. 이 단계에서도 미들웨어가 개입해 핸들러가 바로 리스폰스를 반환하도록 할 수 있다.



##### 7. 뷰

장고는 무엇이든지 간단한 요구조건 몇가지만 들어맞으면 뷰로 분류한다. 

* 호출가능해야한다.

* 첫번쨰 인자로 `django.http.HttpRequest` 의 인스턴스를 받는다.

* `django.http.HttpResponse` 인스턴스를 반환하거나 예외를 발생시킨다.





##### 8. 응답시간(Response time)

템플릿이 있을 경우, 템플릿이 렌더링 된 후, 또는 그에 상응하는 결과가 생성된 후에는 뷰가 `django.http.HttpResponse` 인스턴스를 생성할 책임이 있다. 이 클래스의 생성자는 2가지 선택적 인수를 받는다.

* 리스폰스 바디에 담을 스트링 

* 리스폰스 헤더 `Content-Type` 의 값



##### 9. 미들웨어 처리 3: 예외

뷰에서 예외가 발생하면 `get_response`가 `_exception_middleware`에 있는 메소드를 호출해 `HttpRequest` 와 예외를 인자로 전달한다. 호출된 메소드 중 하나가 `HttpResponse`를 반환한다.



##### 10. 무응답  

아래와 같은 경우일때  `HttpResponse` 를 반환한다.

1. 뷰가 값을 반환하지 않음

2. 뷰가 예외를 발생시키지만 그걸 처리할수 있는 미들웨어가 없음

3. 예외를 처리하는 미들웨어에서 새 예외사항이 발생함

이러한 상황이 발생할 경우 `get_response` 가 자체적으로 에러를 처리한다.

1. `http404` 예외가 발생하고 `DEBUG=True` 일 경우, `get_response`가 `django.views.debug.technical_404_response` 라는 뷰를 실행하고 `HttpRequest` 와 익셉션을 전달한다. 이 뷰는 URL Resolver 가 매치하려고 햇었던 패턴에 대한 정보를 표시한다.
2. 만약 `DEBUG=False` 이면 익셉션은 `Http404`, `get_response` 가 URL Resolver 의 `resolve_404` 를 호출한다. 이 메소드는 url 설정을 읽어서 어떤 뷰가 404 에러를 핸들링 해야 하는지 찾는다. 디폴트 값은 `django.views.defaults.page_not_found` 이지만, 변수 `hanlder404`에 값을 할당해 URL 설정을 오버라이드 할 수 있다.
3. 익셉션의 종류에 상관없이, `DEBUG=True` 일 경우, `get_response`가 `django.views.debug.technical_500_response` 뷰를 실행하고 `HttpResponse`와 익셉션을 인자로 전달한다. 이 뷰는 트레이스백, 스택 각 레벨의 지역 변수, 등 자세한 정보를 제공한다.
4. `DEBUG=False` 일 경우, `get_response` 가 URL 리졸버의 `resolve_500` 메소들르 호출하고, 3번고 비슷한 방법으로 작동한다. 

추가적으로, `django.http.Http404` 또는 파이선 빌트인 `SystemExit` 이외의 익셉션일 경우, 핸들러는 디스패처 신호 `got_request_exception`을 실행하고 반환하기 전에 장고 admins 설정에 리스팅된 사람들에게 메일을 발송하기전에 예외에 대한 설명을 만든다.



##### 11. 미들웨어 처리 4, 마지막 단계

이 단계에서 `HttpResponse` 인스턴스를 반환한다. `HttpResponse`는 `_response_middleware`의 메소드를 호출하고, `HttpRequest`, `HttpResponse`를 인자로 전달한다. 이 단계는 미들웨어가 변화을 일으킬 수 있는 마지막 단계다.



##### 12. 응답

이제 마지막 단계다. 핸들러가 디스패처 시그널 `request_finished` 를 발생시킨다. 이 신호를 받은 핸들러는 현재 리퀘스트를 위해 사용했던 자원들을 정리하고 해제한다. 예를 들어, 장고는 열러있는 모든 데이터베이스 커넥션을 닫는  `request_finished` 에 리스너를 연결한다. 이 작업 뒤에, 핸들러는 적절한 반환할 값을 만들고 반환한다.



이렇게 해서 장고가 리퀘스트를 다루는 처음부터 마지막 까지 과정을 훑어보았다. 



##### References

* https://www.b-list.org/weblog/2006/jun/13/how-django-processes-request/