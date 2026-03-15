# ⛳ IREA App — 골프장 회원 · 라커 통합 관리 시스템

> 골프장 현장 운영에 최적화된 데스크탑 기반 회원 관리 솔루션

<br>

## 📌 프로젝트 소개

**IREA App**은 골프장의 **회원 정보 관리**와 **라커 사용 현황 관리**를 하나의 데스크탑 애플리케이션으로 통합한 사내 운영 시스템입니다.

기존에 수기 또는 분산된 방식으로 관리되던 회원 데이터와 라커 배정 이력을 체계화하여, 현장 직원이 빠르고 정확하게 업무를 처리할 수 있도록 설계하였습니다.

<br>

## 🖥️ 주요 기능

| 기능 | 설명 |
|------|------|
| 👤 회원 등록 · 조회 | 신규 회원 등록, 회원 정보 수정 및 상세 조회 |
| 🗂️ 회원 검색 · 필터링 | 이름 · 회원번호 · 등급 등 다양한 조건으로 회원 검색 |
| 🔐 라커 배정 관리 | 라커 번호 배정, 사용 현황 조회 및 반납 처리 |
| 📋 사용 이력 조회 | 회원별 라커 사용 기록 및 이력 추적 |
| 📊 현황 대시보드 | 전체 라커 사용률 및 회원 현황 요약 화면 |

<br>

## 🛠️ 기술 스택

### Frontend
![Desktop App](https://img.shields.io/badge/Platform-Desktop-blue?style=flat-square)

- 데스크탑 GUI 프레임워크
- 폰트: `Pretendard`, `Noto Sans KR`

### Backend
![Backend](https://img.shields.io/badge/Role-Backend-green?style=flat-square)

- RESTful API 설계 및 구현
- 데이터 처리 로직 개발

### Database
![DB](https://img.shields.io/badge/Role-DB_Design-orange?style=flat-square)

- 관계형 데이터베이스 설계 (ERD 작성)
- 회원 · 라커 · 사용이력 테이블 구조 설계
- 쿼리 최적화

> 🔧 *구체적인 기술 스택은 추후 업데이트 예정*

<br>

## 👥 팀 구성 및 역할

| 구분 | 인원 | 역할 |
|------|------|------|
| 전체 팀 | 4명 이상 | 기획 · 디자인 · 프론트엔드 · 백엔드 |
| **본인 담당** | **1명** | **백엔드 개발 · DB 설계** |

<br>

## 💡 담당 업무 상세

### 🗄️ DB 설계
- 회원 정보, 라커 현황, 사용 이력을 포함한 **전체 데이터베이스 ERD 설계**
- 데이터 정합성을 위한 **정규화(Normalization)** 적용
- 효율적인 조회를 위한 **인덱스 설계**

### ⚙️ 백엔드 개발
- 회원 CRUD API 개발 (등록 · 조회 · 수정 · 삭제)
- 라커 배정 · 반납 처리 비즈니스 로직 구현
- 사용 이력 조회 및 검색 필터링 API 구현

<br>

## 📁 프로젝트 구조

```
IREA_App/
├── src/
│   ├── api/          # API 엔드포인트
│   ├── models/       # 데이터 모델
│   ├── services/     # 비즈니스 로직
│   └── utils/        # 공통 유틸리티
├── static/
│   └── styles/
│       └── fonts/    # Pretendard, NotoSansKR
├── database/
│   └── schema/       # ERD 및 마이그레이션
└── README.md
```

<br>

## 🧩 ERD 주요 테이블 (간략)

```
[Member] ──< [LockerUsage] >── [Locker]
  - member_id         - usage_id              - locker_id
  - name              - member_id (FK)        - locker_number
  - phone             - locker_id (FK)        - location
  - grade             - assigned_at           - status
  - joined_at         - returned_at
```

<br>

## 📈 성과 및 배운 점

- 실제 운영 환경에 배포되는 **실무형 프로젝트** 경험
- 복잡한 관계형 데이터를 효율적으로 설계하는 **DB 모델링 역량** 향상
- 팀 협업을 통해 **프론트엔드-백엔드 간 API 명세 협의** 및 커뮤니케이션 경험

<br>

---

<div align="center">

**IREA App** · 데스크탑 회원 관리 시스템  
Team Project · Backend & DB Design

</div>
