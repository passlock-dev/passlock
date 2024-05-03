import { Dialog as SheetPrimitive } from 'bits-ui'
import { tv, type VariantProps } from 'tailwind-variants'

import Content from './sheet-content.svelte'
import Description from './sheet-description.svelte'
import Footer from './sheet-footer.svelte'
import Header from './sheet-header.svelte'
import Overlay from './sheet-overlay.svelte'
import Portal from './sheet-portal.svelte'
import Title from './sheet-title.svelte'

const Root = SheetPrimitive.Root
const Close = SheetPrimitive.Close
const Trigger = SheetPrimitive.Trigger

export {
  Close,
  Content,
  Description,
  Footer,
  Header,
  Overlay,
  Portal,
  Root,
  //
  Root as Sheet,
  Close as SheetClose,
  Content as SheetContent,
  Description as SheetDescription,
  Footer as SheetFooter,
  Header as SheetHeader,
  Overlay as SheetOverlay,
  Portal as SheetPortal,
  Title as SheetTitle,
  Trigger as SheetTrigger,
  Title,
  Trigger
}

export const sheetVariants = tv({
  base: 'fixed z-50 gap-4 bg-background p-6 shadow-lg',
  variants: {
    side: {
      top: 'inset-x-0 top-0 border-b',
      bottom: 'inset-x-0 bottom-0 border-t',
      left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
      right: 'inset-y-0 right-0 h-full w-3/4  border-l sm:max-w-sm'
    }
  },
  defaultVariants: {
    side: 'right'
  }
})

export const sheetTransitions = {
  top: {
    in: {
      y: '-100%',
      duration: 500,
      opacity: 1
    },
    out: {
      y: '-100%',
      duration: 300,
      opacity: 1
    }
  },
  bottom: {
    in: {
      y: '100%',
      duration: 500,
      opacity: 1
    },
    out: {
      y: '100%',
      duration: 300,
      opacity: 1
    }
  },
  left: {
    in: {
      x: '-100%',
      duration: 500,
      opacity: 1
    },
    out: {
      x: '-100%',
      duration: 300,
      opacity: 1
    }
  },
  right: {
    in: {
      x: '100%',
      duration: 500,
      opacity: 1
    },
    out: {
      x: '100%',
      duration: 300,
      opacity: 1
    }
  }
}

export type Side = VariantProps<typeof sheetVariants>['side']
