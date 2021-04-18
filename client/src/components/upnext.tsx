import { FunctionalComponent, h, Fragment } from 'preact'
import { useRef, useState, useEffect } from 'preact/hooks'
import cx from 'classnames'
import * as Machine from '../machine/types'
import Button, { ButtonType } from './button'
import { toSongAndVideoTitle } from '../lib/to-title'
import ListIcon from '../icons/list'
import CloseIcon from '../icons/close'
import { Track, Repeat, SelectMode, MediaMode } from '../types'
import ModeControls from './mode-controls'

interface Props {
  selected?: Track
  send: Machine.PlayerSend
  upNext: Machine.TrackOrder
  order: Machine.TrackOrder
  tracks: Machine.PlayerContext['tracksById']
  ready: boolean
  shuffle: boolean
  repeat: Repeat
  selectMode: SelectMode
  mediaMode: MediaMode
}

const UpNext: FunctionalComponent<Props> = ({
  upNext,
  order,
  tracks,
  send,
  selected,
  shuffle,
  repeat,
  selectMode,
  mediaMode,
  ready,
}) => {
  const overlayRef = useRef<HTMLDivElement>()
  const closeRef = useRef<HTMLDivElement>()
  const panelRef = useRef<HTMLDivElement>()
  const [visible, setVisible] = useState(false)
  const [panelTransitionEnd, setPanelTransitionEnd] = useState(!visible)
  const upNextOrder = upNext.trackOrder.slice(upNext.selectedIndex + 1)
  const hasUpNext = upNextOrder.length > 0

  useEffect(() => {
    if (visible) {
      setPanelTransitionEnd(false)
      // This is a hack so I don't have to use forwardRef (I think)
      closeRef.current?.querySelector('button')?.focus()
      document.body.style.overflow = 'hidden'
      return (): void => void (document.body.style.overflow = 'visible')
    } else {
      const panelRefNode = panelRef.current
      const listener = (): void => setPanelTransitionEnd(true)
      panelRefNode?.addEventListener('transitionend', listener)
      return (): void =>
        panelRefNode?.removeEventListener('transitionend', listener)
    }
  }, [visible])

  return (
    <Fragment>
      <Button
        class={cx([
          'flex transition-transform duration-200 z-20',
          'fixed right-0 mr-2 mb-2-safe bottom-0 c:mt-2 c:mb-0 c:top-0 c:bottom-auto',
        ])}
        onClick={(): void => setVisible(true)}
        style={{
          transform: `translate(${visible ? '100%' : '0'})`,
        }}
      >
        <ListIcon height={24} />
        {upNextOrder.length > 0 && (
          <span
            class="ml-1 tabular-nums"
            style={{ height: '18px', lineHeight: '18px' }}
          >
            {upNextOrder.length}
          </span>
        )}
      </Button>
      <div
        ref={overlayRef}
        class={cx(
          'transition-opacity duration-200',
          'fixed inset-0 flex items-start z-20 justify-end bg-white',
          visible ? 'opacity-50' : 'opacity-0',
          panelTransitionEnd ? 'invisible' : 'visible'
        )}
        onClick={(e): void => {
          if (e.target === overlayRef.current) {
            setVisible(false)
          }
        }}
      />
      <div
        ref={panelRef}
        class={cx(
          'transition-transform duration-200 fixed right-0 inset-y-0 h-screen max-w-sm w-full flex flex-col',
          'bg-white border-l border-gray-600  z-30',
          !panelTransitionEnd && 'shadow-xl'
        )}
        style={{
          transform: `translate(${visible ? '0' : '100%'})`,
          height: ' -webkit-fill-available',
        }}
      >
        <div
          class="flex justify-between items-center p-2 border-b border-gray-600 shadow"
          ref={closeRef}
        >
          <h1>Up Next {upNextOrder.length > 0 && upNextOrder.length}</h1>
          <Button onClick={(): void => setVisible(false)} class="px-2">
            <CloseIcon height={18} />
          </Button>
        </div>
        <div class="flex-1 overflow-y-scroll px-2 pt-2">
          <div class="flex flex-col border-b border-gray-600 mb-2 pb-2">
            {upNextOrder.map((track) => (
              <div class="flex mb-1" key={track.orderId}>
                <Button
                  class="flex-grow mr-1 truncate"
                  tight
                  onClick={(): void =>
                    send({
                      type: 'SELECT_TRACK',
                      order: 'upNext',
                      orderId: track.orderId,
                      trackId: track.trackId,
                      forcePlay: true,
                    })
                  }
                >
                  {toSongAndVideoTitle(tracks[track.trackId])}
                </Button>
                <Button
                  buttonType={ButtonType.Danger}
                  onClick={(): void =>
                    send({
                      type: 'REMOVE_TRACK',
                      order: 'upNext',
                      id: track.orderId,
                    })
                  }
                >
                  <CloseIcon height={18} />
                </Button>
              </div>
            ))}
            <div class="flex -mx-1">
              {hasUpNext && (
                <Button
                  class="mx-1 flex-1"
                  buttonType={ButtonType.Danger}
                  onClick={(): void =>
                    send({ type: 'REMOVE_ALL_TRACKS', order: 'upNext' })
                  }
                >
                  Clear Up Next
                </Button>
              )}
              <Button
                class={cx(hasUpNext ? 'mr-1' : 'mx-1', 'flex-1')}
                onClick={(): void =>
                  void window.prompt(
                    'Share this url',
                    `${window.location.origin}${window.location.pathname}#${[
                      selected?.id,
                      ...upNextOrder.map((t) => t.trackId),
                    ]
                      .filter(Boolean)
                      .join(',')}`
                  )
                }
              >
                Share
              </Button>
            </div>
          </div>

          <div class="flex flex-col">
            {order.trackOrder.slice(order.selectedIndex + 1).map((track) => (
              <Button
                key={track.orderId}
                class="mb-1 truncate"
                tight
                onClick={(): void =>
                  send({
                    type: 'SELECT_TRACK',
                    order: 'order',
                    orderId: track.orderId,
                    trackId: track.trackId,
                    forcePlay: true,
                  })
                }
              >
                {toSongAndVideoTitle(tracks[track.trackId])}
              </Button>
            ))}
          </div>
        </div>
        <div class="flex p-2 pb-2-safe border-t border-gray-600 shadow">
          <ModeControls
            ready={ready}
            send={send}
            shuffle={shuffle}
            selectMode={selectMode}
            mediaMode={mediaMode}
            repeat={repeat}
            class="ml-1 first:ml-0"
          />
          <Button onClick={(): void => setVisible(false)} class="ml-auto px-2">
            <CloseIcon height={18} />
          </Button>
        </div>
      </div>
    </Fragment>
  )
}

export default UpNext
