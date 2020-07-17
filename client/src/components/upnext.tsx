import { FunctionalComponent, h, Fragment } from 'preact'
import { useRef, useState, useLayoutEffect } from 'preact/hooks'
import cx from 'classnames'
import * as Machine from '../machine/types'
import Button, { ButtonType } from './button'
import toTitle from '../lib/to-title'
import ListIcon from '../icons/list'
import CloseIcon from '../icons/close'
import { Track } from '../types'

interface Props {
  selected?: Track
  send: Machine.PlayerSend
  upNext: Machine.TrackOrder
  order: Machine.TrackOrder
  tracks: Machine.PlayerContext['tracksById']
}

const UpNext: FunctionalComponent<Props> = ({
  upNext,
  order,
  tracks,
  send,
  selected,
}) => {
  const overlayRef = useRef<HTMLDivElement>()
  const closeRef = useRef<HTMLDivElement>()
  const [visible, setVisible] = useState(false)
  const upNextOrder = upNext.trackOrder.slice(upNext.selectedIndex + 1)

  useLayoutEffect(() => {
    if (visible) {
      closeRef.current?.querySelector('button')?.focus()
      document.body.style.overflow = 'hidden'
      return (): void => void (document.body.style.overflow = 'visible')
    }
  }, [visible])

  return (
    <Fragment>
      <Button
        class="flex transition-transform duration-200 fixed right-0 mr-2 mt-2 top-0 z-20"
        onClick={(): void => setVisible(true)}
        style={{ transform: `translate(${visible ? '100%' : '0'})` }}
      >
        <ListIcon height={18} />
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
          'fixed inset-0 flex items-start z-20 justify-end bg-gray-600',
          visible ? 'opacity-50 visible' : 'invisible opacity-0'
        )}
        onClick={(e): void => {
          if (e.target === overlayRef.current) {
            setVisible(false)
          }
        }}
      />
      <div
        class={cx(
          'transition-transform duration-200 fixed right-0 inset-y-0 h-screen max-w-sm w-full flex flex-col',
          'shadow-md bg-white border-l border-gray-600 pt-2 z-30'
        )}
        style={{ transform: `translate(${visible ? '0' : '100%'})` }}
      >
        <div
          class="flex justify-between items-center pb-2 border-b border-gray-600 px-2 shadow"
          ref={closeRef}
        >
          <h1>Up Next {upNextOrder.length > 0 && upNextOrder.length}</h1>
          <Button onClick={(): void => setVisible(false)}>
            <CloseIcon height={18} />
          </Button>
        </div>
        <div class="flex-1 overflow-y-scroll px-2 pt-2">
          {upNextOrder.length > 0 && (
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
                    {toTitle(tracks[track.trackId])}
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
                <Button
                  class="mx-1 flex-1"
                  buttonType={ButtonType.Danger}
                  onClick={(): void =>
                    send({ type: 'REMOVE_ALL_TRACKS', order: 'upNext' })
                  }
                >
                  Clear Up Next
                </Button>
                <Button
                  class="mr-1 flex-1"
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
          )}
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
                {toTitle(tracks[track.trackId])}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Fragment>
  )
}

export default UpNext
