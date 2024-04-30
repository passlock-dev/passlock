import ArrowRight from 'lucide-svelte/icons/arrow-right'
import Check from 'lucide-svelte/icons/check'
import ChevronLeft from 'lucide-svelte/icons/chevron-left'
import ChevronRight from 'lucide-svelte/icons/chevron-right'
import CircleHelp from 'lucide-svelte/icons/circle-help'
import ClipboardCheck from 'lucide-svelte/icons/clipboard-check'
import Copy from 'lucide-svelte/icons/copy'
import CreditCard from 'lucide-svelte/icons/credit-card'
import EllipsisVertical from 'lucide-svelte/icons/ellipsis'
import File from 'lucide-svelte/icons/file'
import FileText from 'lucide-svelte/icons/file-text'
import Image from 'lucide-svelte/icons/image'
import Laptop from 'lucide-svelte/icons/laptop'
import LoaderCircle from 'lucide-svelte/icons/loader-circle'
import Moon from 'lucide-svelte/icons/moon'
import Pizza from 'lucide-svelte/icons/pizza'
import Plus from 'lucide-svelte/icons/plus'
import Settings from 'lucide-svelte/icons/settings'
import SunMedium from 'lucide-svelte/icons/sun-medium'
import Trash from 'lucide-svelte/icons/trash'
import TriangleAlert from 'lucide-svelte/icons/triangle-alert'
import User from 'lucide-svelte/icons/user'
import X from 'lucide-svelte/icons/x'
import Mail from 'lucide-svelte/icons/mail'

import type { SvelteComponent } from 'svelte'
import Apple from './apple.svelte'
import Aria from './aria.svelte'
import GitHub from './github.svelte'
import Google from './google.svelte'
import Hamburger from './hamburger.svelte'
import Logo from './logo.svelte'
import Npm from './npm.svelte'
import PayPal from './paypal.svelte'
import Pnpm from './pnpm.svelte'
import RadixSvelte from './radix-svelte.svelte'
import Tailwind from './tailwind.svelte'
import Twitter from './twitter.svelte'
import Yarn from './yarn.svelte'
import FieldError from './field-error.svelte'
import Passkey from './passkey.svelte'

export type Icon = SvelteComponent

export const logo = Logo
export const close = X
export const spinner = LoaderCircle
export const chevronLeft = ChevronLeft
export const chevronRight = ChevronRight
export const trash = Trash
export const post = FileText
export const page = File
export const media = Image
export const settings = Settings
export const billing = CreditCard
export const ellipsis = EllipsisVertical
export const add = Plus
export const warning = TriangleAlert
export const user = User
export const arrowRight = ArrowRight
export const help = CircleHelp
export const pizza = Pizza
export const twitter = Twitter
export const check = Check
export const copy = Copy
export const copyDone = ClipboardCheck
export const sun = SunMedium
export const moon = Moon
export const laptop = Laptop
export const gitHub = GitHub
export const radix = RadixSvelte
export const aria = Aria
export const npm = Npm
export const yarn = Yarn
export const fieldError = FieldError
export const pnpm = Pnpm
export const tailwind = Tailwind
export const google = Google
export const apple = Apple
export const paypal = PayPal
export const passkey = Passkey
export const hamburger = Hamburger
export const mail = Mail
