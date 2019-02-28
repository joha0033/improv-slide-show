import React, {
  useState, useEffect, useReducer, useRef, useLayoutEffect,
} from 'react';
import './App.css';
import PropTypes from 'prop-types';
import {
  FaPlay,
  FaPause,
  FaChevronCircleRight,
  FaChevronCircleLeft,
  FaCircle,
} from 'react-icons/fa';

// navigator.mediaDevices.getUserMedia({ audio: true })
//   .then((stream) => {
//     const mediaRecorder = new MediaRecorder(stream);
//     mediaRecorder.start();
//   });

export const SLIDE_DURATION = 30000;

export function Slide({
  isCurrent,
  takeFocus,
  slide,
}) {
  const ref = useRef();
  useEffect(() => {
    if (isCurrent && takeFocus) {
      ref.current.focus();
    }
  }, [isCurrent, takeFocus]);

  return (
    <li
      ref={ref}
      aria-hidden={!isCurrent}
      tabIndex='-1'
      className='Slide'
      style={{ backgroundImage: `url(${slide.url})` }}
    />
  );
}

Slide.propTypes = {
  isCurrent: PropTypes.bool.isRequired,
  takeFocus: PropTypes.bool.isRequired,
  slide: PropTypes.shape({
    url: PropTypes.string,
  }).isRequired,
};

export function Slides(props) {
  return (
    <ul className='Slides' {...props} />
  );
}

export function Carousel(props) {
  return (
    <section className='Carousel' {...props} />
  );
}

export function Controls(props) {
  return <div className='Controls' {...props} />;
}

export function SlideNav(props) {
  return <div className='SlideNav' {...props} />;
}

export function SlideNavItem(props) {
  const { isCurrent } = props;
  return isCurrent
    ? <button type='button' className='SlideNavItemOn' {...props} />
    : <button type='button' className='SlideNavItemOff' {...props} />;
}

SlideNavItem.propTypes = {
  isCurrent: PropTypes.bool.isRequired,
};

export function IconButton(props) {
  const { name } = props;
  return name === 'Play'
    ? <button type='button' className='IconButtonLarge' {...props} />
    : <button type='button' className='IconButton' {...props} />;
}

IconButton.propTypes = {
  name: PropTypes.string.isRequired,
};

export function SpacerGif({ width }) {
  return (
    <div
      style={{ display: 'inline-block', width }}
    />
  );
}

SpacerGif.propTypes = {
  width: PropTypes.string.isRequired,
};


export const useProgress = (animate, time) => {
  const [progress, setProgress] = useState(0);

  useLayoutEffect(() => {
    let rafId = null;
    if (animate) {
      let start = null;
      const step = (timestamp) => {
        if (!start) start = timestamp;
        setProgress(timestamp - start);
        if (progress < time) {
          rafId = requestAnimationFrame(step);
        }
      };
      rafId = requestAnimationFrame(step);
    }

    return () => cancelAnimationFrame(rafId);
  }, [time, animate]);

  return animate
    ? Math.min(progress / time, time)
    : 0;
};

export function ProgressBar({ animate, time }) {
  const progressUsed = useProgress(animate, time);

  return (
    <div className='ProgressBar'>
      <div
        style={{ width: `${progressUsed * 100}%` }}
      />
    </div>
  );
}

ProgressBar.propTypes = {
  animate: PropTypes.bool.isRequired,
  time: PropTypes.number.isRequired,
};

// eslint-disable-next-line react/prop-types
const Loading = ({ slides }) => (slides
  ? (<h1 className='Loading'>Loading...</h1>)
  : (<h1 className='Loading'>Thanks for Visiting!</h1>));

export default function App() {
  // eslint-disable-next-line no-shadow
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'PROGRESS':
      case 'NEXT': return {
        ...state,
        isPlaying: action.type === 'PROGRESS',
        takeFocus: false,
        currentIndex: (state.currentIndex + 1) % state.slides.length,
      };
      case 'PREV': return {
        ...state,
        isPlaying: false,
        takeFocus: false,
        currentIndex: (state.currentIndex - 1 + state.slides.length) % state.slides.length,
      };
      case 'PLAY': return {
        ...state,
        takeFocus: false,
        isPlaying: true,
      };
      case 'PAUSE': return {
        ...state,
        takeFocus: false,
        isPlaying: false,
      };
      case 'GOTO': return {
        ...state,
        takeFocus: true,
        currentIndex: action.index,
      };
      case 'FETCH_SUCCESS': return {
        ...state,
        loading: false,
        slides: action.slides,
      };
      case 'RESTART': return {
        ...state,
        start: !state.start,
        loading: true,
        slides: console.log('a new start'),
      };
      case 'FINISHED': return {
        ...state,
        isPlaying: false,
        loading: true,
        slides: console.log('insert finishing slide??'),
      };
      default: return state;
    }
  }, {
    currentIndex: 0,
    slides: ['empty'],
    loading: true,
    isPlaying: false,
    takeFocus: false,
    start: false,
  });

  useEffect(() => {
    if (!state.loading && state.currentIndex === state.slides.length - 1) {
      setTimeout(() => {
        dispatch({ type: 'FINISHED' });
      }, SLIDE_DURATION - 50);
    }
  }, [state.currentIndex]);

  const fetchSlides = async () => {
    const response = await fetch('https://photo-api-2019.herokuapp.com/images/array_of/3/')
      .then(res => res.json())
      .then((data) => {
        dispatch({ type: 'FETCH_SUCCESS', slides: data.images });
        return data;
      });
    return response;
  };

  useEffect(() => { setTimeout(() => (fetchSlides()), 1500); }, [state.restart]);

  useEffect(() => {
    let timeout;
    if (state.isPlaying) {
      timeout = setTimeout(() => {
        dispatch({ type: 'PROGRESS' });
      }, SLIDE_DURATION);
    }
    return () => { clearTimeout(timeout); };
  }, [state.currentIndex, state.isPlaying]);

  return (
    state.loading
      ? (
        <div className='PlayAgain'>
          <Loading
            slides={state.slides}
          />
        </div>
      )
      : (
        <div className='App'>
          <header className='App-header'>
            <Carousel>
              <Slides>
                {
                    state.slides.map((slide, index) => (
                      <Slide
                        isCurrent={index === state.currentIndex}
                        key={slide.id}
                        slide={slide}
                        takeFocus={state.takeFocus}
                      />
                    ))
                  }
              </Slides>
              <SlideNav>
                {
                    state.slides.map((slide, index) => (index === state.currentIndex
                      ? (
                        <SlideNavItem
                          key={slide.id}
                          aria-label={`Slide ${index + 1}`}
                          onClick={() => {
                            dispatch({ type: 'GOTO', index });
                          }}
                        >
                          <FaCircle style={{ opacity: 1 }} />
                        </SlideNavItem>
                      )
                      : (
                        <SlideNavItem
                          key={slide.id}
                          aria-label={`Slide ${index + 1}`}
                          onClick={() => {
                            dispatch({ type: 'GOTO', index });
                          }}
                        >
                          <FaCircle style={{ opacity: 0.6 }} />
                        </SlideNavItem>
                      )))
                  }
              </SlideNav>
              <Controls>
                {
                    state.isPlaying
                      ? (
                        <IconButton
                          name='Pause'
                          aria-label='Pause'
                          onClick={() => { dispatch({ type: 'PAUSE' }); }}
                        >
                          <FaPause />
                        </IconButton>
                      )
                      : (
                        <IconButton
                          name='Play'
                          aria-label='Play'
                          onClick={() => {
                            dispatch({ type: 'PLAY' });
                          }}
                        >
                          <FaPlay />
                        </IconButton>
                      )
                  }
                <SpacerGif width='10px' />
                <IconButton
                  aria-label='Previous Slide'
                  onClick={() => {
                    dispatch({ type: 'PREV' });
                  }}
                >
                  <FaChevronCircleLeft />
                </IconButton>
                <SpacerGif width='10px' />
                <IconButton
                  aria-label='Next Slide'
                  onClick={() => {
                    dispatch({ type: 'NEXT' });
                  }}
                >
                  <FaChevronCircleRight />
                </IconButton>
              </Controls>
              <ProgressBar
                key={state.currentIndex + state.isPlaying}
                time={SLIDE_DURATION}
                animate={state.isPlaying}
                // lastSlide={state.currentIndex === state.slides.length - 1}
              />
            </Carousel>
          </header>
        </div>
      ));
}
