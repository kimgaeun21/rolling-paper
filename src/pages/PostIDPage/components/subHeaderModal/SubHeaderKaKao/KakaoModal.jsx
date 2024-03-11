import React, { useEffect, useRef } from 'react';
import * as S from './KakaoModal.style';

// const BASE_URL = 'https://rolling-api.vercel.app/4-11/';
const Link_DOMAIN = 'https://rolling-paper-4-11.netlify.app/';

const KakaoModal = ({ setKakaoOpen, value, setToastStatus }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    // Kakao SDK 로드
    const loadKakaoSDK = () => {
      const kakaoSDKScript = document.createElement('script');
      kakaoSDKScript.src = 'https://developers.kakao.com/sdk/js/kakao.js';
      kakaoSDKScript.async = true;
      document.body.appendChild(kakaoSDKScript);
    };

    loadKakaoSDK(); // Kakao SDK 로드

    // 컴포넌트 언마운트 시 SDK 스크립트 제거
    return () => {
      const scriptElement = document.querySelector(
        'script[src^="https://developers.kakao.com/sdk/js/kakao.js"]',
      );
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, []);

  // 카카오 SDK 초기화
  useEffect(() => {
    if (window.Kakao) {
      window.Kakao.init('562d986eb2adf9e3ca81fe68ab551236'); // 여기에 애플리케이션에서 받은 JavaScript 키를 넣어줍니다.
    }
  }, []);

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      setKakaoOpen(false);
    }
  };

  const shareToKakaoTalk = () => {
    // 카카오 링크 보내기
    window.Kakao.Link.sendDefault({
      objectType: 'feed',
      content: {
        title: `${value.userName}님의 롤링페이퍼입니다`,
        description: ``,
        imageUrl: '이미지 URL',
        link: {
          mobileWebUrl: `${Link_DOMAIN}post/${value.userId}/`,
          webUrl: `${Link_DOMAIN}post/${value.userId}/`,
        },
      },
      buttons: [
        {
          title: '웹으로 보기',
          link: {
            mobileWebUrl: `${Link_DOMAIN}post/${value}/`,
            webUrl: `${Link_DOMAIN}post/${value}/`,
          },
        },
      ],
    });
    setKakaoOpen(false);
  };

  const copyToClipboard = () => {
    const url = `${Link_DOMAIN}post/${value.userId}/`;
    navigator.clipboard.writeText(url);
    setKakaoOpen(false);
    setToastStatus({ visible: true, update: true });
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setKakaoOpen]);
  return (
    <S.ModalWrap ref={modalRef}>
      <S.ShareButton onClick={shareToKakaoTalk}>카카오톡 공유</S.ShareButton>
      <S.ShareButton onClick={copyToClipboard}>URL 공유</S.ShareButton>
    </S.ModalWrap>
  );
};

export default KakaoModal;
