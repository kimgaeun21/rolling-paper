import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import * as S from './MessageCardWrapper.style';
import { AddMessageCard } from '../AddMessageCard/AddMessageCard';
import { getMessageCardData, deleteMessageCardData } from '../../API';
import loadingIcon from '../../assets/icon/loading.svg';
import { MessageCard } from '../MessageCard/MessageCard';
import { Toast } from '../Toast/Toast';
const PAGE_LOADING = 12;
const INITIAL_PAGE_LOADING = 11;
const options = {
  threshold: 0.3,
};

export const MessageCardWrapper = ({
  messageCardData,
  handleMessageCardData,
  handleCurrentCardData,
  setDataError,
  pageRef,
}) => {
  const { userID } = useParams();
  const offset = useRef(0);
  const gridWrapperRef = useRef(null);
  const target = useRef(null);
  const timerRef = useRef(null);
  const deleteCount = useRef(0);
  const messageCount = useRef(0);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const handleToastvisible = () => {
    setToastVisible(false);
  };
  //update loading state to load data when reach the end of page
  const handleIntersectionObserver = (entry) => {
    if (entry[0].isIntersecting && !initialLoading) {
      setLoading(true);
      offset.current = messageCardData.length;
    }
  };
  //load cardData at initial rendering
  const initialGetCardData = async (limit = null, offset = null) => {
    const { data, count, error } = await getMessageCardData(
      userID,
      limit,
      offset,
    );
    if (!error) {
      handleMessageCardData([...data]);
      messageCount.current = count;
      if (data.length < INITIAL_PAGE_LOADING) {
        const pageFullHeight = pageRef.current.scrollHeight;
        const pageviewHeight = pageRef.current.clientHeight;
        if (pageFullHeight - pageviewHeight < 90) {
          gridWrapperRef.current.style.height = '95vh';
        }
      }
    } else {
      if (error) {
        setDataError(error);
      }
    }
    setLoading(false);
    setInitialLoading(false);
  };
  //load additional cardData when reach the end of page
  const getCardData = async (limit = null, offset = null) => {
    const {
      data,
      count: newMessageCount,
      error,
    } = await getMessageCardData(userID, limit, offset);
    if (error) {
      setDataError(error);
      return;
    }
    if (newMessageCount > messageCount.current) {
      const updateCount = newMessageCount - messageCount.current;
      const { data: updateData, error: updateError } = await getMessageCardData(
        userID,
        updateCount,
        0,
      );
      if (updateError) {
        setDataError(updateError);
        return;
      }
      handleMessageCardData((prevCardData) => [...updateData, ...prevCardData]);
      messageCount.current = newMessageCount;
      const restData = data.slice(updateCount);
      handleMessageCardData((prevCardData) => [...prevCardData, ...restData]);
    } else {
      handleMessageCardData((prev) => [...prev, ...data]);
    }

    if (data.length < PAGE_LOADING) {
      pageRef.current.scrollTop -= 90;
    }
    if (data.length === 0) {
      if (toastVisible) {
        clearTimeout(timerRef.current);
      }
      setToastVisible(true);
    }
    setLoading(false);
    deleteCount.current = 0;
  };

  //delete card data(for each message card component)
  const deleteCardData = useCallback(async (cardID) => {
    const { error } = await deleteMessageCardData(cardID);
    if (error) {
      setDataError(error);
    } else {
      offset.current -= 1;
      deleteCount.current = (deleteCount.current + 1) % 3;
      handleMessageCardData((prevCardData) =>
        prevCardData.filter((cardData) => cardData.id !== cardID),
      );
      messageCount.current -= 1;
    }
  }, []);
  //data load function, loaded loading Icon
  const dataLoad = () => {
    if (loading) {
      if (initialLoading) {
        initialGetCardData(INITIAL_PAGE_LOADING, offset.current);
      } else {
        getCardData(PAGE_LOADING + deleteCount.current, offset.current);
      }
    }
  };
  //regist intersectionObserver to check reaching theend of page
  useEffect(() => {
    const observer = new IntersectionObserver(
      handleIntersectionObserver,
      options,
    );
    if (target.current) {
      observer.observe(target.current);
    }
    return () => {
      observer.disconnect(target.current);
    };
  }, [handleIntersectionObserver]);

  return (
    <>
      <S.GridWrapper ref={gridWrapperRef}>
        {!initialLoading && <AddMessageCard />}
        {messageCardData.map((cardData, index) => (
          <MessageCard
            cardData={cardData}
            key={index}
            handleCurrentCardData={handleCurrentCardData}
            deleteCardData={deleteCardData}
          />
        ))}
      </S.GridWrapper>
      {loading ? (
        <S.LoadingIcon
          src={loadingIcon}
          alt="loading"
          $initialLoading={initialLoading}
          onLoad={dataLoad}
        />
      ) : (
        <div ref={target} style={{ width: '100%', height: '1px' }}></div>
      )}
      <Toast
        type="load"
        toastVisible={toastVisible}
        handleToastvisible={handleToastvisible}
        timerRef={timerRef}
      ></Toast>
    </>
  );
};
