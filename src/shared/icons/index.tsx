/**
 * Ikonkalar — YAGONA MANBA (Hugeicons, stroke rounded to'plami).
 * Nomlar lucide'dagi eski nomlar bilan bir xil qoldirilgan, shuning uchun chaqiruv joylari
 * (`<Plus size={18} strokeWidth={1.75} />`) o'zgarmaydi. Yangi ikonka kerak bo'lsa — shu yerga qo'shing,
 * `@hugeicons/core-free-icons` ni komponentlarda to'g'ridan-to'g'ri import qilmang.
 */
import {
  AddToListIcon,
  Add01Icon,
  ActivitySparkIcon,
  AiBrain01Icon,
  AiMicIcon,
  AiVoiceIcon,
  Alert02Icon,
  AlertCircleIcon,
  Analytics01Icon,
  ArrowDataTransferHorizontalIcon,
  ArrowDown01Icon,
  ArrowExpandDiagonal01Icon,
  ArrowLeft01Icon,
  ArrowReloadHorizontalIcon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  ArrowUp01Icon,
  Baby01Icon,
  BotIcon,
  Building03Icon,
  Calendar03Icon,
  CalendarAdd01Icon,
  CalendarCheckIn01Icon,
  CalendarRemove01Icon,
  CalendarRemove02Icon,
  CalendarSearchIcon,
  Call02Icon,
  CallDisabled02Icon,
  CallMissed01Icon,
  CallOutgoing01Icon,
  CallRinging01Icon,
  Cancel01Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  CloudUploadIcon,
  Compass01Icon,
  CreditCardIcon,
  DashboardSquare02Icon,
  Delete02Icon,
  DiscountTag01Icon,
  DollarCircleIcon,
  Door01Icon,
  DoorIcon,
  File02Icon,
  FlashIcon,
  HealthIcon,
  HistoryIcon,
  ImageAdd01Icon,
  InboxIcon,
  Invoice01Icon,
  Key01Icon,
  Layers01Icon,
  Layout01Icon,
  LightbulbIcon,
  LinkSquare02Icon,
  Logout03Icon,
  Medicine02Icon,
  Menu01Icon,
  Message01Icon,
  Mic01Icon,
  MoneyReceive02Icon,
  MoreVerticalIcon,
  NextIcon,
  Notification03Icon,
  PackageAdd01Icon,
  PackageIcon,
  PackageOutOfStockIcon,
  PencilEdit02Icon,
  PlayCircleIcon,
  PlayIcon,
  PrinterIcon,
  Search01Icon,
  SecurityBlockIcon,
  SecurityCheckIcon,
  Sent02Icon,
  Settings01Icon,
  SidebarLeft01Icon,
  SidebarLeftIcon,
  SmileIcon,
  SparklesIcon,
  Stethoscope02Icon,
  Task01Icon,
  Tick02Icon,
  TickDouble02Icon,
  Timer02Icon,
  Undo02Icon,
  UserAdd01Icon,
  UserIcon,
  UserMultipleIcon,
  UserRemove01Icon,
  UserSettings01Icon,
  UserSettings02Icon,
  VolumeHighIcon,
  VolumeMute01Icon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons';
// TZ: qabul, 3D, laboratoriya, hujjatlar, filiallar
import {
  ContractsIcon,
  CubeIcon,
  DentalToothIcon,
  FullScreenIcon,
  GlobeIcon,
  HourglassIcon,
  KeyboardIcon,
  Location01Icon,
  MinusSignIcon,
  Presentation01Icon,
  RepeatIcon,
  Rotate360Icon,
  SignatureIcon,
  Store01Icon,
  TestTube01Icon,
  ThreeDViewIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type HugeiconsProps, type IconSvgElement } from '@hugeicons/react';
import type { FC } from 'react';

export type IconProps = Omit<HugeiconsProps, 'icon' | 'altIcon' | 'showAlt'>;
export type AppIcon = FC<IconProps>;

const make = (icon: IconSvgElement, name: string): AppIcon => {
  const Icon: AppIcon = (props) => <HugeiconsIcon icon={icon} strokeWidth={1.5} aria-hidden {...props} />;
  Icon.displayName = name;
  return Icon;
};

// Navigatsiya va layout
export const LayoutDashboard = make(DashboardSquare02Icon, 'LayoutDashboard');
export const Menu = make(Menu01Icon, 'Menu');
export const PanelLeftClose = make(SidebarLeft01Icon, 'PanelLeftClose');
export const PanelLeftOpen = make(SidebarLeftIcon, 'PanelLeftOpen');
export const PanelsTopLeft = make(Layout01Icon, 'PanelsTopLeft');
export const Layers = make(Layers01Icon, 'Layers');
export const Compass = make(Compass01Icon, 'Compass');
export const Settings = make(Settings01Icon, 'Settings');
export const Building2 = make(Building03Icon, 'Building2');
export const DoorClosed = make(DoorIcon, 'DoorClosed');
export const DoorOpen = make(Door01Icon, 'DoorOpen');
export const BarChart3 = make(Analytics01Icon, 'BarChart3');
export const ExternalLink = make(LinkSquare02Icon, 'ExternalLink');
export const Maximize2 = make(ArrowExpandDiagonal01Icon, 'Maximize2');
export const Search = make(Search01Icon, 'Search');
export const Bell = make(Notification03Icon, 'Bell');
export const Inbox = make(InboxIcon, 'Inbox');
export const LogOut = make(Logout03Icon, 'LogOut');

// Strelkalar
export const ArrowRight = make(ArrowRight02Icon, 'ArrowRight');
export const ArrowRightLeft = make(ArrowDataTransferHorizontalIcon, 'ArrowRightLeft');
export const ChevronDown = make(ArrowDown01Icon, 'ChevronDown');
export const ChevronUp = make(ArrowUp01Icon, 'ChevronUp');
export const ChevronLeft = make(ArrowLeft01Icon, 'ChevronLeft');
export const ChevronRight = make(ArrowRight01Icon, 'ChevronRight');
export const RotateCcw = make(ArrowReloadHorizontalIcon, 'RotateCcw');
export const Undo2 = make(Undo02Icon, 'Undo2');
export const History = make(HistoryIcon, 'History');

// Amallar
export const Plus = make(Add01Icon, 'Plus');
export const X = make(Cancel01Icon, 'X');
export const Check = make(Tick02Icon, 'Check');
export const CheckCheck = make(TickDouble02Icon, 'CheckCheck');
export const Pencil = make(PencilEdit02Icon, 'Pencil');
export const Trash2 = make(Delete02Icon, 'Trash2');
export const EllipsisVertical = make(MoreVerticalIcon, 'EllipsisVertical');
export const Printer = make(PrinterIcon, 'Printer');
export const ListPlus = make(AddToListIcon, 'ListPlus');
export const ImagePlus = make(ImageAdd01Icon, 'ImagePlus');
export const UploadCloud = make(CloudUploadIcon, 'UploadCloud');
export const Play = make(PlayIcon, 'Play');
export const CirclePlay = make(PlayCircleIcon, 'CirclePlay');
export const SkipForward = make(NextIcon, 'SkipForward');

// Holat
export const CircleAlert = make(AlertCircleIcon, 'CircleAlert');
export const TriangleAlert = make(Alert02Icon, 'TriangleAlert');
export const CircleCheck = make(CheckmarkCircle02Icon, 'CircleCheck');
export const CircleX = make(CancelCircleIcon, 'CircleX');
export const ShieldCheck = make(SecurityCheckIcon, 'ShieldCheck');
export const ShieldX = make(SecurityBlockIcon, 'ShieldX');
export const KeyRound = make(Key01Icon, 'KeyRound');

// Kalendar
export const CalendarDays = make(Calendar03Icon, 'CalendarDays');
export const CalendarCheck2 = make(CalendarCheckIn01Icon, 'CalendarCheck2');
export const CalendarClock = make(Timer02Icon, 'CalendarClock');
export const CalendarOff = make(CalendarRemove01Icon, 'CalendarOff');
export const CalendarX2 = make(CalendarRemove02Icon, 'CalendarX2');
export const CalendarPlus = make(CalendarAdd01Icon, 'CalendarPlus');
export const CalendarSearch = make(CalendarSearchIcon, 'CalendarSearch');

// Odamlar
export const UserRound = make(UserIcon, 'UserRound');
export const Users = make(UserMultipleIcon, 'Users');
export const UserPlus = make(UserAdd01Icon, 'UserPlus');
export const UserX = make(UserRemove01Icon, 'UserX');
export const UserCog = make(UserSettings01Icon, 'UserCog');
export const UserRoundCog = make(UserSettings02Icon, 'UserRoundCog');
export const Baby = make(Baby01Icon, 'Baby');
export const Smile = make(SmileIcon, 'Smile');

// Tibbiyot
export const Stethoscope = make(Stethoscope02Icon, 'Stethoscope');
export const HeartPulse = make(HealthIcon, 'HeartPulse');
export const Pill = make(Medicine02Icon, 'Pill');
export const FileText = make(File02Icon, 'FileText');
export const ClipboardList = make(Task01Icon, 'ClipboardList');

// Qo'ng'iroqlar
export const Phone = make(Call02Icon, 'Phone');
export const PhoneCall = make(CallRinging01Icon, 'PhoneCall');
export const PhoneMissed = make(CallMissed01Icon, 'PhoneMissed');
export const PhoneOff = make(CallDisabled02Icon, 'PhoneOff');
export const PhoneOutgoing = make(CallOutgoing01Icon, 'PhoneOutgoing');

// Pul va ombor
export const Wallet = make(Wallet01Icon, 'Wallet');
export const CreditCard = make(CreditCardIcon, 'CreditCard');
export const Receipt = make(Invoice01Icon, 'Receipt');
export const CircleDollarSign = make(DollarCircleIcon, 'CircleDollarSign');
export const HandCoins = make(MoneyReceive02Icon, 'HandCoins');
export const BadgePercent = make(DiscountTag01Icon, 'BadgePercent');
export const Package = make(PackageIcon, 'Package');
export const PackagePlus = make(PackageAdd01Icon, 'PackagePlus');
export const PackageX = make(PackageOutOfStockIcon, 'PackageX');

// AI va intellektual yordamchi
export const Sparkles = make(SparklesIcon, 'Sparkles');
export const ActivitySpark = make(ActivitySparkIcon, 'ActivitySpark');
export const Brain = make(AiBrain01Icon, 'Brain');
export const Bot = make(BotIcon, 'Bot');
export const Zap = make(FlashIcon, 'Zap');
export const MessageSquare = make(Message01Icon, 'MessageSquare');
export const Send = make(Sent02Icon, 'Send');
export const Lightbulb = make(LightbulbIcon, 'Lightbulb');
export const Mic = make(Mic01Icon, 'Mic');
export const AiMic = make(AiMicIcon, 'AiMic');
export const AiVoice = make(AiVoiceIcon, 'AiVoice');
export const Volume2 = make(VolumeHighIcon, 'Volume2');
export const VolumeX = make(VolumeMute01Icon, 'VolumeX');

// TZ: qabul, 3D, laboratoriya, hujjatlar, filiallar
export const Tooth = make(DentalToothIcon, 'Tooth');
export const Cube3D = make(CubeIcon, 'Cube3D');
export const View3D = make(ThreeDViewIcon, 'View3D');
export const Rotate360 = make(Rotate360Icon, 'Rotate360');
export const FullScreen = make(FullScreenIcon, 'FullScreen');
export const Presentation = make(Presentation01Icon, 'Presentation');
export const FlaskLab = make(TestTube01Icon, 'FlaskLab');
export const Contract = make(ContractsIcon, 'Contract');
export const Signature = make(SignatureIcon, 'Signature');
export const Hourglass = make(HourglassIcon, 'Hourglass');
export const Globe = make(GlobeIcon, 'Globe');
export const Keyboard = make(KeyboardIcon, 'Keyboard');
export const Repeat = make(RepeatIcon, 'Repeat');
export const MapPin = make(Location01Icon, 'MapPin');
export const Store = make(Store01Icon, 'Store');
export const Minus = make(MinusSignIcon, 'Minus');
