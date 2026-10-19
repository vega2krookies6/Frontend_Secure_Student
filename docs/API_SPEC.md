# Student · Department REST API 명세

> 브랜치 : `feature/bruteforce-demo`
> 모든 예시는 실제 서버를 실행해 받은 응답입니다. ( 초기 데이터 : `DataInitRunner` 학과 4개 / 학생 8명 )

## 목차
1. [개요](#1-개요)
2. [인증 흐름](#2-인증-흐름)
3. [권한](#3-권한)
4. [공통 규칙](#4-공통-규칙) — 페이징, 오류 응답
5. [데이터 모델](#5-데이터-모델)
6. [API 목록](#6-api-목록)
   - [6.1 인증](#61-인증-apiuserinfos)
   - [6.2 학생](#62-학생-apistudents)
   - [6.3 학과](#63-학과-apidepartments)
   - [6.4 검색](#64-검색-apisearch)
7. [클라이언트 구현 시 주의사항](#7-클라이언트-구현-시-주의사항)

---

## 1. 개요

| 항목 | 값 |
|---|---|
| Base URL | `http://localhost:8080` |
| 데이터 형식 | `application/json` ( UTF-8 ) |
| 인증 방식 | JWT Bearer 토큰 ( `Authorization: Bearer <accessToken>` ) |
| 토큰 만료 | accessToken 900초(15분) / refreshToken 1209600초(14일). accessToken 이 만료되면 refreshToken 으로 갱신(`/refresh`)한다 |
| 날짜 형식 | `yyyy-MM-dd` ( 예 : `"1998-03-15"` ) |
| CORS 허용 Origin | `http://localhost:3000`, `http://localhost:5173`, `http://127.0.0.1:5500` |

### 테스트 계정
서버 시작 시 자동으로 만들어집니다.

| 이메일 | 비밀번호 | 권한 | 비고 |
|---|---|---|---|
| `admin@aa.com` | `pwd1` | `ROLE_ADMIN`, `ROLE_USER` | 전체 목록 · 검색 · 등록 · 수정 · 삭제 모두 가능 |
| `user@aa.com` | `pwd2` | `ROLE_USER` | 등록한 학생이 없음( 남의 학생 조회 시 403 확인용 ) |
| `cs001@aa.com` ~ `cs003@aa.com`, `ee001@aa.com`, `ee002@aa.com`, `me001@aa.com`, `ba001@aa.com`, `ba002@aa.com` | `pwd1234` | `ROLE_USER` | 학생 소유자 데모 계정. 각각 학번이 같은 학생(`CS001` 등) 1명을 등록해 둔 상태로 시작한다 |

> 다른 Origin 에서 호출해야 하면 서버의 `app.cors.allowed-origins` 설정에 추가해야 합니다.

---

## 2. 인증 흐름

```
1) POST /api/userinfos/login   { "email", "password" }
       └─> 200 { "accessToken": "eyJ...", "refreshToken": "d8f4...",
                 "tokenType": "Bearer", "expiresIn": 900,
                 "email": "admin@aa.com", "name": "adminboot", "roles": ["ROLE_ADMIN","ROLE_USER"] }

2) accessToken · refreshToken 을 sessionStorage 에, 사용자 정보( email, name, roles )를 상태에 저장한다

3) roles 로 화면을 구성한다
       roles 에 "ROLE_ADMIN" 이 있으면 등록 · 수정 · 삭제 버튼을 보여 준다

4) 이후 모든 /api/** 요청에 헤더를 붙인다
       Authorization: Bearer eyJ...

5) 새로고침 등으로 사용자 정보가 사라지면
       GET /api/userinfos/me  ( 토큰만 있으면 된다 )  → { email, name, roles } 로 복원

6) accessToken 이 만료되면( 15분 ) refreshToken 으로 조용히 갱신한다
       POST /api/userinfos/refresh   { "refreshToken" }
       └─> 200 { "accessToken", "refreshToken", ... }   (refreshToken 도 매번 새로 발급된다 — 회전)
   갱신도 실패하면( refreshToken 도 만료 / 이미 사용됨 ) 그때 비로소 로그인 화면으로 보낸다.

7) 로그아웃하면 서버에 refreshToken 폐기를 요청한 뒤 토큰을 지운다
       POST /api/userinfos/logout   { "refreshToken" }  → 204

8) 401 을 받으면 → ( 갱신도 실패한 ) 토큰 없음 / 만료 / 위조  → 토큰을 지우고 로그인 화면으로 보낸다
   403 을 받으면 → 권한 부족 ( 버튼을 숨겼다면 보통 발생하지 않는다 )
```

- 토큰 없이 호출할 수 있는 API 는 `/api/userinfos/welcome`, `/api/userinfos/new`, `/api/userinfos/login`,
  `/api/userinfos/refresh`, `/api/userinfos/logout` 다섯 개입니다. (뒤의 둘은 accessToken 이 아니라
  요청 본문의 refreshToken 으로 신원을 확인하므로 Authorization 헤더가 필요 없습니다.)
- 서버는 세션을 쓰지 않습니다( STATELESS ). 쿠키를 보낼 필요가 없습니다.
- **연속으로 로그인에 실패하면 계정이 잠깁니다**( 기본 5회, 5분 ). 잠긴 동안 로그인하면 401 과 함께
  "로그인 시도 횟수를 초과하여 계정이 잠겼습니다 ..." 메시지가 옵니다. 메시지를 그대로 보여 주면 됩니다.
- **토큰 보관 권장 : `sessionStorage`**. 새로고침해도 유지되고 탭을 닫으면 사라집니다.
  `localStorage` 는 탭을 닫아도 남아 편하지만 XSS 에 노출되면 토큰이 유출될 수 있습니다.
- `roles` 는 **화면 표시용**입니다. 실제 권한 검사는 서버가 하므로, 클라이언트에서 조작해도 권한이 생기지 않습니다.

---

## 3. 권한

학생 쪽 권한이 **본인이 등록한 학생만** 다룰 수 있도록 바뀌었습니다( OWASP #1 접근제어 · IDOR 방지 데모 ).

| 대상 | 조회 ( GET ) | 등록 ( POST ) | 수정 ( PUT ) | 삭제 ( DELETE ) |
|---|---|---|---|---|
| `/api/students`, `/paged` ( 전체 목록 ) | **`ROLE_ADMIN`** | - | - | - |
| `/api/students/{id}`, `/number/{번호}` ( 단건 ) | 본인이 등록한 학생 또는 `ROLE_ADMIN` | - | 본인이 등록한 학생 또는 `ROLE_ADMIN` | `ROLE_ADMIN` |
| `/api/students` ( 등록 ) | - | `ROLE_USER` 또는 `ROLE_ADMIN` ( 등록하면 그 학생의 소유자가 된다 ) | - | - |
| `/api/departments/**` ( 조회 ) | `ROLE_USER` 또는 `ROLE_ADMIN` | `ROLE_ADMIN` | `ROLE_ADMIN` | `ROLE_ADMIN` |
| `/api/departments/{id}/students`, `/paged` ( 학과별 전체 PII ) | **`ROLE_ADMIN`** | - | - | - |
| `/api/search/**` | `ROLE_USER` 또는 `ROLE_ADMIN` | - | - | - |

- `/api/students/{id}` 단건 조회는 **본인이 등록한 학생이 아니면 관리자여도 아닌 이상 403** 입니다.
  ( 메시지 : `본인 정보만 조회할 수 있습니다` )
- `GET /api/departments/{id}` ( 학과 단건 조회 )는 소속 학생 목록이 함께 오지만, 여기엔 이름 · 학번만
  들어 있고 주소 · 전화번호 · 이메일 등 PII 는 없습니다. 그래서 일반 사용자도 조회할 수 있습니다.
  PII 가 포함된 `/api/departments/{id}/students` 는 별도 API 이고 관리자 전용입니다.
- `/api/search/**` 는 **소유권을 검사하지 않습니다.** 로그인만 했으면 `ROLE_USER` 도 다른 학생의
  이름 · 학번으로 검색해 PII 를 볼 수 있습니다( 단건 조회의 IDOR 방지와 상충되는 부분이라,
  이 프런트엔드는 일반 사용자에게 검색 UI 를 아예 보여 주지 않습니다 ).
- 내 권한은 **로그인 응답의 `roles`** 또는 **`GET /api/userinfos/me`** 로 확인합니다.
- 회원가입( `/api/userinfos/new` )으로 만든 계정은 항상 **`ROLE_USER`** 입니다. 관리자 계정은 API 로 만들 수 없습니다.
- 권한이 부족하면 **403** 이 반환됩니다.

---

## 4. 공통 규칙

### 4.1 페이징 요청 파라미터
이름이 `/paged` 로 끝나는 API 와 `/api/search/**` 는 페이징을 지원합니다.

| 파라미터 | 설명 | 기본값 |
|---|---|---|
| `page` | 페이지 번호 ( **0부터 시작** ) | `0` |
| `size` | 한 페이지 건수 | `10` ( 최대 2000 ) |
| `sort` | `필드명,asc` 또는 `필드명,desc`. 여러 번 지정 가능 | API 마다 다름 ( 각 API 참고 ) |

```
GET /api/students/paged?page=1&size=5&sort=name,asc&sort=id,desc
```

정렬에 쓸 수 있는 필드 ( 모두 실제 호출로 확인 )

| 대상 | 필드 |
|---|---|
| 학생 목록 · 검색 | `id`, `name`, `studentNumber` |
| 학과 목록 ( `/api/departments/paged` ) | `id`, `name`, `code`, `studentCount` |

> **기본 정렬이 API 마다 다릅니다.** 학생 목록은 `id,asc`, 검색은 `name,asc` 입니다.
> 검색창을 비우고 목록으로 돌아가면 순서가 바뀌어 보이므로, 클라이언트에서 **`sort` 를 항상 명시**하기를 권장합니다.

### 4.2 페이징 응답
```json
{
  "content": [ ... ],
  "totalElements": 8,
  "totalPages": 4,
  "number": 0,
  "size": 2,
  "numberOfElements": 2,
  "first": true,
  "last": false,
  "empty": false,
  "sort": { "empty": false, "unsorted": false, "sorted": true },
  "pageable": {
    "pageNumber": 0, "pageSize": 2, "offset": 0,
    "sort": { "empty": false, "unsorted": false, "sorted": true },
    "unpaged": false, "paged": true
  }
}
```

| 필드 | 의미 |
|---|---|
| `content` | 현재 페이지 데이터 |
| `totalElements` | 전체 건수 |
| `totalPages` | 전체 페이지 수 |
| `number` | 현재 페이지 번호 ( 0부터 ) |
| `size` | 요청한 페이지 크기 |
| `numberOfElements` | 이 페이지에 실제로 담긴 건수 ( 마지막 페이지에서는 `size` 보다 작을 수 있음 ) |
| `first` / `last` | 첫 / 마지막 페이지 여부 ( 이전·다음 버튼 활성화에 사용 ) |

> `pageable`, `sort` 는 Spring 기본 직렬화 형식이라 서버 버전에 따라 달라질 수 있습니다.
> 화면 구현에는 위 표의 필드만 사용하기를 권장합니다.

### 4.3 오류 응답
오류 응답은 **발생 위치에 따라 형식이 조금씩 다릅니다.** `statusCode` 와 `message` 를 우선 사용하세요.

**(1) 일반 오류 ( 404, 409, 로그인 실패 401, 권한 부족 403 )**
```json
{ "statusCode": 404, "message": "Student not found with id: 999", "timestamp": "2026-09-19 04:17:03 토 오전" }
```

**(2) 토큰 없음 / 만료 / 위조 ( 401 )**
```json
{ "statusCode": 401, "message": "인증이 필요합니다 ( 유효한 토큰이 없습니다 )", "timestamp": "2026-09-19T04:17:00.561162100" }
```

**(3) 입력값 검증 실패 ( 400 )** — 필드별 메시지가 `errors` 에 담깁니다.
```json
{
  "status": 400,
  "message": "입력항목 검증 오류",
  "timestamp": "2026-09-19T04:17:05.7382128",
  "errors": {
    "departmentId": "Department ID is required",
    "name": "Student name is required",
    "detailRequest": "Student detail is required"
  }
}
```
> 검증 오류만 상태 필드 이름이 `status` 입니다. ( 나머지는 `statusCode` )

**(4) 회원가입 결과** — JSON 이 아닌 **일반 텍스트**입니다. ( [6.1](#61-인증-apiuserinfos) 참고 )

### 4.4 상태 코드 요약
| 코드 | 의미 | 언제 |
|---|---|---|
| 200 | 성공 | 조회, 수정, 로그인 |
| 201 | 생성됨 | 등록, 회원가입 |
| 204 | 본문 없음 | 삭제 성공 |
| 400 | 잘못된 요청 | 입력값 검증 실패, JSON 형식 오류 |
| 401 | 인증 실패 | 토큰 없음 / 만료 / 위조, 로그인 실패 |
| 403 | 권한 부족 | `ROLE_USER` 가 등록 · 수정 · 삭제 호출 |
| 404 | 없음 | 존재하지 않는 id / 학번 / 학과코드 |
| 409 | 충돌 | 학번 · 이메일 · 전화번호 · 학과코드 · 학과명 중복, 학생이 있는 학과 삭제 |

---

## 5. 데이터 모델

### 5.1 Student ( 응답 )
```json
{
  "id": 1,
  "name": "Alice Johnson",
  "studentNumber": "CS001",
  "department": { "id": 1, "name": "Computer Science", "code": "CS" },
  "detail": {
    "id": 1,
    "address": "123 Tech Street",
    "phoneNumber": "010-1234-5678",
    "email": "alice@example.com",
    "dateOfBirth": "1998-03-15"
  }
}
```
- **`/api/students` 로 등록한 학생은 항상 `detail` 이 있습니다.** ( 등록 시 `detailRequest` 가 필수 )
  `detail` 이 `null` 인 경우는 DB 에 직접 넣은 데이터뿐입니다. 이런 학생도 PUT 에 `detailRequest` 를 담아 보내면 상세정보가 새로 만들어집니다.
- `department` 는 이전 경로 `/api/students/detail` 로 등록한 학생에서 `null` 일 수 있습니다. ( 6.2 참고 )
- `detail.address`, `detail.dateOfBirth` 는 `null` 일 수 있습니다.
- 학생 안의 `department` 에는 `studentCount` 가 **포함되지 않습니다.**

### 5.2 Student ( 요청 : 등록 · 수정 공통 )
```json
{
  "name": "Simple Student",
  "studentNumber": "CS998",
  "departmentId": 1,
  "detailRequest": {
    "address": "Seoul",
    "phoneNumber": "010-9999-0001",
    "email": "simple@example.com",
    "dateOfBirth": "2000-01-15"
  }
}
```

| 필드 | 필수 | 규칙 |
|---|---|---|
| `name` | O | 공백 불가, 최대 100자 |
| `studentNumber` | O | 공백 불가, 최대 20자, **중복 불가** |
| `departmentId` | O | 존재하는 학과 id |
| `detailRequest` | O | 객체 |
| `detailRequest.phoneNumber` | O | 공백 불가, 최대 20자, **중복 불가** |
| `detailRequest.email` | O | 이메일 형식, 최대 100자, **중복 불가** |
| `detailRequest.address` | - | 최대 200자 |
| `detailRequest.dateOfBirth` | - | `yyyy-MM-dd` |

> 수정( PUT )도 **전체 값을 보내야 합니다.** 보내지 않은 선택 항목은 `null` 로 바뀝니다.
>
> **중복 검사는 자기 자신을 제외합니다.** 학번 · 이메일 · 전화번호를 그대로 두고 PUT 해도 409 가 나지 않습니다.
> ( 값이 **바뀔 때만** 다른 학생과 겹치는지 검사합니다 )

### 5.3 Department ( 응답 )
목록 조회 ( 요약형 ) — 학생 목록 없이 학생 수만 담깁니다.
```json
{ "id": 1, "name": "Computer Science", "code": "CS", "studentCount": 3 }
```

단건 조회 · 등록 · 수정 ( 상세형 ) — 소속 학생 목록이 함께 담깁니다.
```json
{
  "id": 1,
  "name": "Computer Science",
  "code": "CS",
  "studentCount": 3,
  "students": [
    { "id": 1, "name": "Alice Johnson", "studentNumber": "CS001" },
    { "id": 2, "name": "Bob Smith", "studentNumber": "CS002" },
    { "id": 8, "name": "Helen Lee", "studentNumber": "CS003" }
  ]
}
```

### 5.4 Department ( 요청 : 등록 · 수정 공통 )
```json
{ "name": "Physics", "code": "PH" }
```

| 필드 | 필수 | 규칙 |
|---|---|---|
| `name` | O | 공백 불가, 최대 100자, **중복 불가** |
| `code` | O | 공백 불가, 최대 10자, **중복 불가** |

> 수정 시 중복 검사는 **자기 자신을 제외**합니다. 학과명 · 코드를 그대로 두고 PUT 해도 409 가 나지 않습니다.

---

## 6. API 목록

### 6.1 인증 ( `/api/userinfos` )
`/me` 를 제외하고 accessToken 없이 호출합니다. ( `/refresh`, `/logout` 은 대신 본문의 refreshToken 을 쓴다 )

| 메서드 | 경로 | 설명 | 성공 |
|---|---|---|---|
| GET | `/api/userinfos/welcome` | 연결 확인용 | 200 ( 텍스트 ) |
| POST | `/api/userinfos/new` | 회원가입 ( 항상 `ROLE_USER` ) | 201 ( 텍스트 ) |
| POST | `/api/userinfos/login` | 로그인 → accessToken · refreshToken · 사용자 정보 발급 | 200 |
| POST | `/api/userinfos/refresh` | `{ "refreshToken" }` → 새 accessToken · refreshToken ( 회전 ) | 200 |
| POST | `/api/userinfos/logout` | `{ "refreshToken" }` → 그 refreshToken 을 서버에서 폐기 | 204 |
| GET | `/api/userinfos/me` | 내 정보 · 권한 조회 ( **accessToken 필요** ) | 200 |

> `/refresh` 는 refreshToken 이 유효하지 않거나( 만료 · 이미 사용됨 ) 이미 사용된 refreshToken 을
> 다시 보내면( 재사용 탐지 ) **401** 을 반환하며, 재사용이 감지된 경우 그 사용자의 refreshToken 이
> 전부 폐기됩니다( 모든 기기에서 다시 로그인해야 함 ).

#### POST `/api/userinfos/new` — 회원가입
```json
{ "name": "newuser", "email": "new@aa.com", "password": "pwd9" }
```

| 필드 | 규칙 |
|---|---|
| `name` | 필수, 최대 50자 |
| `email` | 필수, 이메일 형식, 최대 100자 |
| `password` | 필수, 4자 이상 |

| 결과 | 응답 ( **text/plain** ) |
|---|---|
| 201 | `newuser user added!!` |
| 409 | `이미 사용 중인 이메일입니다 : new@aa.com` |
| 400 | 검증 오류 JSON ( 4.3 의 (3) ) |

> 요청에 `roles` 를 넣어도 무시됩니다.

#### POST `/api/userinfos/login` — 로그인
```json
{ "email": "admin@aa.com", "password": "pwd1" }
```
**200**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmMzEyNTRkMi05ZGNhLTQ5ZDctYWU1ZS1iNDU3YWFiMDNiODgi...",
  "refreshToken": "d8f45cb2305845a888ff025c4b09d4093b5581a7d7ea4ed597f4688065ea2b0c",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "email": "admin@aa.com",
  "name": "adminboot",
  "roles": ["ROLE_ADMIN", "ROLE_USER"]
}
```
`user@aa.com` 으로 로그인하면 `"roles": ["ROLE_USER"]` 입니다.
**401** ( 이메일 또는 비밀번호 불일치, 또는 계정 잠김 )
```json
{ "statusCode": 401, "message": "자격 증명에 실패하였습니다.", "timestamp": "2026-09-19 04:16:59 토 오전" }
```

#### POST `/api/userinfos/refresh` — 토큰 갱신
```json
{ "refreshToken": "d8f45cb2305845a888ff025c4b09d4093b5581a7d7ea4ed597f4688065ea2b0c" }
```
**200** — 로그인 응답과 같은 모양. `refreshToken` 이 매번 새로 발급된다( 방금 쓴 것은 더 이상 못 쓴다 ).
**401** ( 만료 / 이미 사용된 refreshToken )
```json
{ "statusCode": 401, "message": "유효하지 않은 refresh 토큰입니다", "timestamp": "..." }
```

#### POST `/api/userinfos/logout` — 로그아웃
```json
{ "refreshToken": "..." }
```
**204** ( 본문 없음 ). 이 refreshToken 은 이후 `/refresh` 에 다시 쓸 수 없다.

#### GET `/api/userinfos/me` — 내 정보
```
GET /api/userinfos/me
Authorization: Bearer <accessToken>
```
**200**
```json
{ "email": "admin@aa.com", "name": "adminboot", "roles": ["ROLE_ADMIN", "ROLE_USER"] }
```
**401** : 토큰 없음 / 만료 / 위조 ( 4.3 의 (2) 형식 )

---

### 6.2 학생 ( `/api/students` )

| 메서드 | 경로 | 권한 | 설명 | 성공 |
|---|---|---|---|---|
| GET | `/api/students` | **ADMIN** | 전체 목록 ( 페이징 없음 ) | 200 `Student[]` |
| GET | `/api/students/paged` | **ADMIN** | 목록 페이징 ( 기본 `sort=id,asc` ) | 200 `Page<Student>` |
| GET | `/api/students/{id}` | **본인 소유 또는 ADMIN** | id 로 조회 | 200 `Student` |
| GET | `/api/students/number/{studentNumber}` | **본인 소유 또는 ADMIN** | 학번으로 조회 | 200 `Student` |
| POST | `/api/students` | USER | 등록 ( 등록한 사람이 소유자가 된다 ) | 201 `Student` |
| PUT | `/api/students/{id}` | **본인 소유 또는 ADMIN** | 수정 | 200 `Student` |
| DELETE | `/api/students/{id}` | **ADMIN** | 삭제 | 204 ( 본문 없음 ) |

USER = `ROLE_USER` 또는 `ROLE_ADMIN`. "본인 소유" 는 그 학생을 등록할 때 로그인해 있던 계정을 말한다
( 응답 JSON 에는 소유자 정보가 들어 있지 않다 — 서버만 알고 있다 ).

#### 오류
| 상황 | 코드 | message 예 |
|---|---|---|
| 없는 id / 학번 | 404 | `Student not found with id: 999` |
| 없는 학과 id ( 등록 · 수정 ) | 404 | `Department not found with id: 99` |
| 학번 중복 | 409 | `Student already exists with student number: CS998` |
| 이메일 중복 | 409 | `Student detail already exists with email: ...` |
| 전화번호 중복 | 409 | `Student detail already exists with phone number: ...` |
| 본인 소유가 아닌 학생 조회 · 수정 ( ADMIN 아님 ) | 403 | `본인 정보만 조회할 수 있습니다` / `본인이 등록한 학생 정보만 수정할 수 있습니다` |
| 일반 사용자가 전체 목록 호출 | 403 | `Access Denied` |

#### 예시 : 등록
```
POST /api/students
Authorization: Bearer <토큰>   (ROLE_USER 도 가능 — 등록하면 그 학생의 소유자가 된다)
Content-Type: application/json

{ "name":"Simple Student", "studentNumber":"CS998", "departmentId":1,
  "detailRequest":{ "address":"Seoul", "phoneNumber":"010-9999-0001",
                    "email":"simple@example.com", "dateOfBirth":"2000-01-15" } }
```
**201** → 5.1 의 `Student` 형식 ( `id` 는 서버가 발급 )

> 같은 기능의 이전 경로 `/api/students/detail/**` 도 남아 있습니다. ( 목록 · id · 학번 조회, 등록 · 수정 · 삭제 )
> 새 클라이언트는 **`/api/students`** 를 사용하세요. 이전 경로로 등록하면 학과와 등록자가 저장되지 않습니다.

---

### 6.3 학과 ( `/api/departments` )

| 메서드 | 경로 | 권한 | 설명 | 성공 |
|---|---|---|---|---|
| GET | `/api/departments` | USER | 전체 목록 ( 요약형 ) | 200 `Department[]` |
| GET | `/api/departments/paged` | USER | 목록 페이징 ( 요약형, 기본 `sort=id,asc` ) | 200 `Page<Department>` |
| GET | `/api/departments/{id}` | USER | id 로 조회 ( 상세형. 소속 학생 이름 · 학번만 포함, PII 없음 ) | 200 `Department` |
| GET | `/api/departments/code/{code}` | USER | 학과코드로 조회 ( 상세형 ) | 200 `Department` |
| GET | `/api/departments/{id}/students` | **ADMIN** | 소속 학생 전체 목록 ( PII 포함 ) | 200 `Student[]` |
| GET | `/api/departments/{id}/students/paged` | **ADMIN** | 소속 학생 페이징 ( PII 포함, 기본 `sort=id,asc` ) | 200 `Page<Student>` |
| POST | `/api/departments` | **ADMIN** | 등록 | 201 `Department` ( 상세형 ) |
| PUT | `/api/departments/{id}` | **ADMIN** | 수정 | 200 `Department` ( 상세형 ) |
| DELETE | `/api/departments/{id}` | **ADMIN** | 삭제 | 204 ( 본문 없음 ) |

#### 오류
| 상황 | 코드 | message 예 |
|---|---|---|
| 없는 id / 코드 | 404 | `Department not found with id: 99` |
| 학과코드 중복 | 409 | `Department already exists with code: CS` |
| 학과명 중복 | 409 | `Department already exists with name: ...` |
| **학생이 있는 학과 삭제** | 409 | `Cannot delete department with id: 1. It has 3 students` |

> 학과를 삭제하려면 소속 학생을 먼저 다른 학과로 옮기거나 삭제해야 합니다.

---

### 6.4 검색 ( `/api/search` )
모두 페이징 응답( `Page<Student>` )이며 권한은 USER 입니다.

> ⚠ 검색은 **소유권을 검사하지 않습니다.** 일반 사용자도 이름 · 학번만 알면 남의 학생 정보(PII 포함)를
> 그대로 볼 수 있습니다. 이 저장소의 React 클라이언트는 그래서 검색 UI 를 관리자에게만 보여 줍니다.

| 메서드 | 경로 | 파라미터 | 기본 정렬 |
|---|---|---|---|
| GET | `/api/search/students` | `keyword` ( 선택 ) | `name,asc` |
| GET | `/api/search/departments/{departmentId}/students` | `keyword` ( 선택 ) | `name,asc` |
| GET | `/api/search/students/by-name` | `name` ( **필수** ) | `name,asc` |
| GET | `/api/search/students/by-number` | `studentNumber` ( **필수** ) | `studentNumber,asc` |

#### `/api/search/students` 의 keyword 해석 규칙
| keyword | 동작 | 예 → 결과 |
|---|---|---|
| 없음 · 빈 문자열 | 전체 목록 | → 8건 |
| **대문자+숫자** 형태 ( `^[A-Z]+\d+$` ) | 학번 **부분 일치** | `CS001` → 1건 |
| 그 외 | 이름 **부분 일치** ( 대소문자 무시 ) | `alice` → 1건 |

> 소문자 `cs001` 은 학번이 아니라 **이름**으로 검색됩니다. 학번 검색은 대문자로 보내거나 `/by-number` 를 사용하세요.

- `/api/search/departments/{id}/students` : `keyword` 가 있으면 해당 학과 안에서 **이름**으로 검색합니다. ( `bob` → CS002 )
- `/by-name`, `/by-number` : 부분 일치, 대소문자 무시 ( `studentNumber=EE` → EE001, EE002 )

---

## 7. 클라이언트 구현 시 주의사항

1. **page 는 0부터** 시작합니다. 화면의 "1페이지" 는 `page=0` 입니다.
2. **오류 형식이 세 가지**입니다. ( 4.3 ) 공통 처리 시 `statusCode ?? status` 로 코드를, `message` 로 문구를 꺼내고, 400 이면 `errors` 를 필드별로 표시합니다.
3. **회원가입 응답은 텍스트**입니다. `response.json()` 이 아니라 `response.text()` 로 읽어야 합니다.
4. **삭제 성공은 204** 로 본문이 없습니다. 본문을 파싱하지 마세요.
5. **수정( PUT )은 전체 교체**입니다. 기존 값을 먼저 조회해 채운 뒤 보내야 합니다.
6. **`timestamp` 형식이 오류 종류마다 다릅니다.** 화면 로직에 사용하지 마세요.
7. **accessToken 은 15분 뒤 만료**됩니다. `/api/userinfos/refresh` 로 refreshToken 을 보내면 새
   accessToken( 과 새 refreshToken )을 받을 수 있습니다. 갱신도 401 이면( refreshToken 도 만료·이미 사용됨 )
   그때 로그인 화면으로 보내세요.
8. **권한별 버튼 표시**는 로그인 응답 또는 `/api/userinfos/me` 의 `roles` 로 판단합니다.
9. **`sort` 를 항상 명시**하세요. 목록과 검색의 기본 정렬이 다릅니다. ( 4.1 )
10. **학생 조회 · 수정은 소유자 전용**입니다( 3. 권한 참고 ). 일반 사용자에게 "전체 목록" 화면을 보여 주지
    말고, 본인이 등록한 학생 하나만 다루는 화면으로 구성하세요.

### 공통 fetch 예시 ( JavaScript )
```js
const BASE = 'http://localhost:8080';

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      // 본문이 있을 때만 붙인다. GET 에도 붙이면 CORS preflight(OPTIONS) 가 매번 추가로 발생한다
      ...(body && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  });

  if (res.status === 204) return null;                       // 삭제 성공
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text(); // 회원가입은 텍스트

  if (!res.ok) {
    const error = new Error(data?.message ?? data);
    error.status = data?.statusCode ?? data?.status ?? res.status;
    error.fields = data?.errors;                             // 400 검증 오류
    throw error;
  }
  return data;
}

// 사용 예
const login = await api('/api/userinfos/login', {
  method: 'POST', body: { email: 'admin@aa.com', password: 'pwd1' },
});
sessionStorage.setItem('accessToken', login.accessToken);
const isAdmin = login.roles.includes('ROLE_ADMIN');          // 등록 · 수정 · 삭제 버튼 표시 여부

const page = await api('/api/students/paged?page=0&size=10&sort=id,asc', { token: login.accessToken });

// 새로고침 후 : 토큰으로 사용자 정보 복원
const token = sessionStorage.getItem('accessToken');
const me = token && await api('/api/userinfos/me', { token });
```
