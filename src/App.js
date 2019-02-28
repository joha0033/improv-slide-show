import React, { useState, useEffect, useReducer, useRef} from 'react';
import './App.css';
// import {DATA as slides} from './data'

import {
  FaPlay,
  FaPause,
  FaChevronCircleRight,
  FaChevronCircleLeft,
  FaCircle
} from 'react-icons/fa'
export const SLIDE_DURATION = 30000

export function Slide({
  isCurrent,
  takeFocus,
  slide,
  id, 
  title,
  children
}){
  // what the hell did this do?? forgot...
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
  return props['aria-label'] === 'Play'
    ? <button className='IconButtonLarge' {...props}/>
    : <button className='IconButton' {...props}/>
}

export function SpacerGif({width}){
  return (
    <div
      style={{display:'inline-block', width}}
    />
  )
}

export function ProgressBar({animate, time, lastSlide}) {
  let progress = useProgress(animate, time, lastSlide)
  
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

/**
 * HOW DO I STOP THE SHOW??? 
 * slides.length-1===state.currentIndex
 * BUT AFTER PROGRESS BAR IS FINISHED!
 */

export function App() {
  let [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'PROGRESS':
      case 'NEXT': return {
        ...state,
        isPlaying: action.type === 'PROGRESS',
        takeFocus: false,
        currentIndex: (state.currentIndex + 1) % state.slides.length
      }
      case 'PREV': return {
        ...state,
        isPlaying: false,
        takeFocus: false,
        currentIndex: (state.currentIndex - 1 + state.slides.length) % state.slides.length
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
      case 'FETCH_SUCCESS': return {
        ...state,
        loading: false,
        slides: action.slides
      }
      case 'RESTART': return {
        ...state,
        start: !state.start,
        loading: true,
        slides: console.log('a new start')
      }
      case 'FINISHED': return {
        ...state,
        isPlaying: false,
        loading: true,
        slides: console.log('insert finishing slide??')
      }
      default: return state
    }
  }, {
    currentIndex: 0,
    slides: ['empty'],
    loading: true,
    isPlaying: false,
    takeFocus: false,
    start: false
  })

  useEffect(() => {
    if(!state.loading && state.currentIndex===state.slides.length-1){
      setTimeout(() => {
        dispatch({type: 'FINISHED'})
      }, SLIDE_DURATION - 50)
    }
  }, [state.currentIndex])

  useEffect(() => {
    fetch(`https://photo-api-2019.herokuapp.com/images/array_of/3/`)
      .then((res) => {
        return res.json()
      })
      .then((data) => {
        dispatch({type: 'FETCH_SUCCESS', slides: data.images})
        return  data
      })
  }, [state.restart])

  useEffect(() => {
    if(state.isPlaying){
      let timeout = setTimeout(() => {
        dispatch({type: 'PROGRESS'})
      }, SLIDE_DURATION)
      return () => {clearTimeout(timeout)}
    }
  }, [state.currentIndex, state.isPlaying])

    return (
      state.loading
        ? (<div className={'PlayAgain'}>
            <h1 className={'Loading'}>Pat your self on the back and refresh for another round!</h1>
          </div>
        ) // some kind of dynamic component... ? start, loading, finished... 
        : (<div className="App">
        <header className="App-header">
          <Carousel>
            <Slides>
              { 
                state.slides.map((slide, index) => {
                  return (
                    <Slide 
                      isCurrent={index===state.currentIndex}
                      key={index}
                      slide={slide}
                      takeFocus={state.takeFocus}
                    />
                  )
                })
                
              }
            </Slides>
            <SlideNav>
              {
                state.slides.map((slide, index) => {
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
              lastSlide={state.currentIndex === state.slides.length-1}
            />

          </Carousel>
        </header>
      </div>
    ))
  }


export default App;