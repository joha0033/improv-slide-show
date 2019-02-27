import React, { useState, useEffect, useReducer, useRef} from 'react';
import './App.css';
import {DATA as slides} from './data'

import {
  FaPlay,
  FaPause,
  FaChevronCircleRight,
  FaChevronCircleLeft,
  FaCircle
} from 'react-icons/fa'
export const SLIDE_DURATION = 2000

export function Slide({
  isCurrent,
  takeFocus,
  slide,
  id, 
  title,
  children
}){
  let ref = useRef()
  useEffect(() => {
    if(isCurrent && takeFocus){
      ref.current.focus()
    }
  }, [isCurrent, takeFocus])

  return (
    <li
      ref={ref}
      aria-hidden={!isCurrent}
      tabIndex="-1"
      className="Slide"
      style={{backgroundImage:`url(http://${slide.url})`}}
    >
    </li>
   
  )
}
export function Slides(props){
  return (
    <ul className='Slides' {...props} />
  )
}

export function Carousel(props){
  return (
    <section className='Carousel' {...props} />
  )
}

export function Controls(props) {
  return <div className='Controls' {...props}/>
}

export function SlideNav(props) {
  return <div className='SlideNav' {...props}/>
}

export function SlideNavItem(props) {
  const { isCurrent } = props
  return isCurrent
    ? <button className='SlideNavItemOn' {...props}/>
    : <button className='SlideNavItemOff' {...props}/>
}

export function IconButton(props) {
  return <button className='IconButton' {...props}/>
}

export function SpacerGif({width}){
  return (
    <div
      style={{display:'inline-block', width}}
    />
  )
}

export function ProgressBar({animate, time}) {
  let progress = useProgress(animate, time)

  return (
  <div className='ProgressBar'>
    <div 
      style={{
        width: `${progress * 100}%`}}
      />
  </div>)
}

export const useProgress = (animate, time) => {
  let [ progress, setProgress ] = useState(0)

  useEffect(( ) => {
      if(animate){
          let rafId = null
          let start = null
          let step = timestamp => {
              if(!start) start = timestamp
              let progress = timestamp - start
              setProgress(progress)
              if(progress < time) {
                  rafId = requestAnimationFrame(step)
              }
          }
          rafId = requestAnimationFrame(step)
          return () => cancelAnimationFrame(rafId)
      }
  }, [time, animate])
  
  return animate 
      ? Math.min(progress/time, time)
      : 0
}

export function App() {
  let [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'PROGRESS':
      case 'NEXT': return {
        ...state,
        isPlaying: action.type === 'PROGRESS',
        takeFocus: false,
        currentIndex: (state.currentIndex + 1) % slides.length
      }
      case 'PREV': return {
        ...state,
        isPlaying: false,
        takeFocus: false,
        currentIndex: (state.currentIndex - 1 + slides.length) % slides.length
      }
      case 'PLAY': return {
        ...state,
        takeFocus: false,
        isPlaying: true,
      }
      case 'PAUSE': return {
        ...state,
        takeFocus: false,
        isPlaying: false,
      }
      case 'GOTO': return {
        ...state,
        takeFocus: true,
        currentIndex: action.index
      }
      case 'FETCHING': return {
        ...state,
        loading: true,
      }
      case 'FETCH_SUCCESS': return {
        ...state,
        loading: false,
        data: action.data
      }
      default: return state
    }
  }, {
    currentIndex: 0,
    slides: ['empty'],
    loading: true,
    isPlaying: true,
    takeFocus: false
  })

  useEffect(() => {
    dispatch({type: 'FETCHING'})
    fetch(`http://localhost:3000/images/array_of/3/`)
      .then((res) => {
        return res.json()
      })
      .then((data) => {
        console.log(data, 'data in useEffect')
        return dispatch({type: 'FETCH_SUCCESS', data: data.images})
      })
  }, [])

  useEffect(() => {
    if(state.isPlaying){
      let timeout = setTimeout(() => {
        dispatch({type: 'PROGRESS'})
      }, SLIDE_DURATION)
      return () => {clearTimeout(timeout)}
    }
  }, [state.currentIndex, state.isPlaying])
    return (
      <div className="App">
        <header className="App-header">
          {
            state.loading
            ? <h1>Loading</h1>
            : console.log(state.data, 'after fetch?!')
          }
          <Carousel>
            <Slides>
              { 
                state.loading
                ? <h1>Loading</h1>
                : (state.data.map((slide, index) => {
                  console.log(slide, 'slide in map1!');
                  
                  return (
                    <Slide 
                      isCurrent={index===state.currentIndex}
                      key={index}
                      slide={slide}
                      takeFocus={state.takeFocus}
                      // children={slide.explanation}
                    />
                  )
                }))
                
              }
            </Slides>
            <SlideNav>
              {
                slides.map((slide, index) => {
                  return index === state.currentIndex
                    ? (<SlideNavItem
                      key={index}
                      children={<FaCircle style={{opacity: 1}}/>}
                      aria-label={`Slide ${index + 1}`}
                      onClick={() => {
                        dispatch({type: 'GOTO', index})
                      }}
                    />)
                    : (<SlideNavItem
                      key={index}
                      children={<FaCircle style={{opacity: .6}} />}
                      aria-label={`Slide ${index + 1}`}
                      onClick={() => {
                        dispatch({type: 'GOTO', index})
                      }}
                    />)
                })
              }
            </SlideNav>

            <Controls>
              {
                state.isPlaying
                  ? (
                    <IconButton
                      aria-label="pause"
                      onClick={() => {dispatch({type: 'PAUSE'})}}
                      children={<FaPause />}
                    />
                  )
                  : (
                    <IconButton
                      aria-label="Play"
                      onClick={() => {
                        dispatch({type: 'PLAY'})
                      }}
                      children={<FaPlay />}
                    />
                  )
              }
              <SpacerGif width="10px"/>
              <IconButton
                aria-label="Previous Slide"
                onClick={() => {
                  dispatch({type: 'PREV'})
                }}
                children={<FaChevronCircleLeft />}
              />
              <SpacerGif width="10px"/>
              <IconButton
                aria-label="Next Slide"
                onClick={() => {
                  dispatch({type: 'NEXT'})
                }}
                children={<FaChevronCircleRight />}
              />
            </Controls>

            <ProgressBar 
              key={state.currentIndex + state.isPlaying}
              time={SLIDE_DURATION}
              animate={state.isPlaying}
            />

          </Carousel>
        </header>
      </div>
    );
  }


export default App;