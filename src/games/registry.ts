import { GameId } from '../types';
import { BaccaratGame } from './baccarat/BaccaratGame';
import { BlackjackGame } from './blackjack/BlackjackGame';
import { CoinFlipGame } from './coinFlip/CoinFlipGame';
import { CrashGame } from './crash/CrashGame';
import { DiceGame } from './dice/DiceGame';
import { DurakGame } from './durak/DurakGame';
import { HigherLowerGame } from './higherLower/HigherLowerGame';
import { KenoGame } from './keno/KenoGame';
import { MinesGame } from './mines/MinesGame';
import { PlinkoGame } from './plinko/PlinkoGame';
import { PokerGame } from './poker/PokerGame';
import { RedBlackGame } from './redBlack/RedBlackGame';
import { RiskRouletteGame } from './riskRoulette/RiskRouletteGame';
import { RouletteGame } from './roulette/RouletteGame';
import { RussianRouletteGame } from './russianRoulette/RussianRouletteGame';
import { ScratchCardsGame } from './scratchCards/ScratchCardsGame';
import { ShellsGame } from './shells/ShellsGame';
import { SicBoGame } from './sicBo/SicBoGame';
import { SlotsGame } from './slots/SlotsGame';
import { TowersGame } from './towers/TowersGame';
import { GameMetadata } from './types';
import { UpgradeGame } from './upgrade/UpgradeGame';
import { VideoPokerGame } from './videoPoker/VideoPokerGame';
import { WheelOfFortuneGame } from './wheelOfFortune/WheelOfFortuneGame';

export const GAME_CATALOG: readonly GameMetadata[] = [
  {
    id: 'roulette',
    title: 'Европейская рулетка',
    shortDescription:
      'Классическое колесо с секторами 0–36, анимированным шариком и полным полем ставок на числа, дюжины и цвета.',
    category: 'roulette-wheels',
    categoryLabel: 'Рулетка и колёса',
    maxMultiplierLabel: 'x36',
    maxMultiplierValue: 36,
    popularityRank: 1,
    featured: true,
    recommended: true,
    minBet: 0.1,
    rules: [
      'Выберите номинал фишки и разместите одну или несколько ставок на игровом сукне.',
      'В европейской рулетке 37 секторов: зелёное Зеро (0) и числа от 1 до 36 (18 красных и 18 чёрных).',
      'Выигрышный номер определяется криптографическим генератором до запуска вращения, после чего шарик останавливается ровно в выпавшем кармане.',
    ],
    payoutTable: [
      { label: 'Точное число (Straight)', payout: 'x36', probability: '1/37 (2.70%)' },
      { label: 'Дюжина / Колонна', payout: 'x3', probability: '12/37 (32.43%)' },
      { label: 'Красное / Чёрное', payout: 'x2', probability: '18/37 (48.65%)' },
      { label: 'Чётное / Нечётное', payout: 'x2', probability: '18/37 (48.65%)' },
      { label: '1–18 / 19–36', payout: 'x2', probability: '18/37 (48.65%)' },
    ],
    Component: RouletteGame,
  },
  {
    id: 'slots',
    title: 'Однорукий бандит',
    shortDescription:
      'Аркадный слот-автомат с режимами на 3 и 5 барабанов, интерактивным рычагом, клевером-джокером и каскадной остановкой.',
    category: 'slots',
    categoryLabel: 'Слоты',
    maxMultiplierLabel: 'x250',
    maxMultiplierValue: 250,
    popularityRank: 2,
    featured: true,
    recommended: true,
    minBet: 0.1,
    rules: [
      'Выберите режим на 3 или 5 барабанов и установите размер ставки.',
      'Запустите вращение кнопкой или потянув рычаг справа от корпуса автомата.',
      'Комбинация формируется по центральной линии. Символ «Клевер» помогает дополнить парные комбинации.',
    ],
    payoutTable: [
      { label: 'Семёрка (3 / 4 / 5)', payout: 'x35 / x80 / x250', probability: 'Редкий джекпот' },
      { label: 'Алмаз (3 / 4 / 5)', payout: 'x22 / x50 / x140', probability: 'Высокий ранг' },
      { label: 'Золотая монета (3 / 4 / 5)', payout: 'x14 / x32 / x85', probability: 'Средний ранг' },
      { label: 'Клевер (3 / 4 / 5)', payout: 'x10 / x24 / x60', probability: 'Wild-поддержка' },
      { label: 'Две Вишни подряд (3 бар.)', payout: 'x1.8', probability: 'Частая выплата' },
    ],
    Component: SlotsGame,
  },
  {
    id: 'blackjack',
    title: 'Блэкджек',
    shortDescription:
      'Классическое противостояние с дилером до 21 очка с поддержкой Hit, Stand, Double Down и полноценного Split.',
    category: 'cards',
    categoryLabel: 'Карточные игры',
    maxMultiplierLabel: 'x2.5',
    maxMultiplierValue: 2.5,
    popularityRank: 3,
    featured: true,
    recommended: false,
    minBet: 0.1,
    rules: [
      'Цель — набрать сумму очков ближе к 21, чем у дилера, не допустив перебора (> 21).',
      'Туз считается за 11 или 1 очко в пользу руки, картинки — по 10 очков.',
      'Доступны действия: Ещё (Hit), Хватит (Stand), Удвоить ставку (Double Down) и Разделить пару (Split). Дилер обязан брать карты до 16 и останавливаться на 17.',
    ],
    payoutTable: [
      { label: 'Натуральный Блэкджек (21 с раздачи)', payout: 'x2.5 (3:2)', probability: '~4.75%' },
      { label: 'Обычная победа над дилером', payout: 'x2.0 (1:1)', probability: '~42.2%' },
      { label: 'Равные очки (Push)', payout: 'x1.0 (возврат)', probability: '~8.5%' },
    ],
    Component: BlackjackGame,
  },
  {
    id: 'poker',
    title: 'Покер',
    shortDescription:
      'Большой овальный кэш-стол до 8 игроков со стеками фишек, блайндами SB/BB, баттоном дилера, рейзами и жёстким Олл-ином.',
    category: 'cards',
    categoryLabel: 'Карточные игры',
    maxMultiplierLabel: 'Банк x8+',
    maxMultiplierValue: 16,
    popularityRank: 1,
    featured: true,
    recommended: true,
    minBet: 0.1,
    rules: [
      'Выберите большой стол на 8 игроков (Full Ring) или динамичный стол на 6 игроков (6-Max). У каждого участника за столом свой собственный стек фишек, а баттон дилера (D), малый (SB) и большой блайнд (BB) двигаются по кругу.',
      'Каждому сдаются 2 закрытые карты, а в центр стола поэтапно выкладываются 5 общих карт (Флоп, Тёрн, Ривер).',
      'На каждой улице торгов доступны действия: Фолд, Чек, Колл, Рейз фишками (1 ББ, 2 ББ, 1/2 Банка, Банк) и ОЛЛ-ИН (ва-банк на весь стек). Соперники играют честно — исключительно по своим картам, борду и размеру банка.',
    ],
    payoutTable: [
      { label: 'Победа лучшей 5-карточной комбинацией', payout: '100% банка фишек', probability: 'Вскрытие (Showdown)' },
      { label: 'Победа фолдом всех соперников', payout: '100% банка фишек', probability: 'Давление ставками / Блеф' },
      { label: 'Равная старшая комбинация', payout: 'Честный раздел банка', probability: 'Split Pot' },
    ],
    Component: PokerGame,
  },
  {
    id: 'mines',
    title: 'Мины',
    shortDescription:
      'Тактическое поле 4×4, 5×5 или 6×6: открывайте изумрудные кристаллы, повышайте множитель и забирайте выигрыш в любой момент.',
    category: 'arcade-risk',
    categoryLabel: 'Аркады и риск',
    maxMultiplierLabel: 'x100+',
    maxMultiplierValue: 100,
    popularityRank: 5,
    featured: true,
    recommended: false,
    minBet: 0.1,
    rules: [
      'Выберите размер сетки (4×4, 5×5 или 6×6) и количество скрытых мин.',
      'Координаты мин генерируются криптографически в момент старта и остаются неизменными весь раунд.',
      'Каждая открытая безопасная ячейка увеличивает множитель. Вы можете забрать выигрыш после любого успешного шага.',
    ],
    payoutTable: [
      { label: '1 кристалл (5×5, 3 мины)', payout: 'x1.10', probability: '22/25 (88%)' },
      { label: '5 кристаллов (5×5, 3 мины)', payout: 'x1.92', probability: '50.4%' },
      { label: '5 кристаллов (5×5, 10 мин)', payout: 'x8.48', probability: '11.4%' },
    ],
    Component: MinesGame,
  },
  {
    id: 'plinko',
    title: 'Plinko',
    shortDescription:
      'Пирамида от 8 до 16 рядов с тремя уровнями риска и реалистичной траекторией падения фишки в ячейки множителей.',
    category: 'arcade-risk',
    categoryLabel: 'Аркады и риск',
    maxMultiplierLabel: 'x500',
    maxMultiplierValue: 500,
    popularityRank: 6,
    featured: true,
    recommended: true,
    minBet: 0.1,
    rules: [
      'Установите уровень риска (Низкий, Средний, Высокий) и число рядов препятствий (8–16).',
      'На каждом ряду препятствий фишка отклоняется влево или вправо с равной вероятностью 50/50.',
      'Крайние ячейки приносят максимальные множители, центральные выпадают чаще всего.',
    ],
    payoutTable: [
      { label: 'Низкий риск (8–16 рядов)', payout: 'x0.5 – x16', probability: 'Плавная дисперсия' },
      { label: 'Средний риск (8–16 рядов)', payout: 'x0.2 – x110', probability: 'Сбалансированный режим' },
      { label: 'Высокий риск (16 рядов)', payout: 'x0.2 – x500', probability: 'Редкие края' },
    ],
    Component: PlinkoGame,
  },
  {
    id: 'upgrade',
    title: 'Апгрейд',
    shortDescription:
      'Система улучшения редких артефактов с точной шкалой вероятности, инверсией сектора и целевыми множителями до x25.',
    category: 'arcade-risk',
    categoryLabel: 'Аркады и риск',
    maxMultiplierLabel: 'x25',
    maxMultiplierValue: 25,
    popularityRank: 7,
    featured: false,
    recommended: true,
    minBet: 0.1,
    rules: [
      'Укажите сумму попытки и выберите желаемый множитель от x1.2 до x25.',
      'Шанс успеха рассчитывается прозрачно по формуле 96% / множитель и отображается зелёной дугой на кольце.',
      'Если указатель останавливается внутри призовой дуги, начисляется улучшенный выигрыш.',
    ],
    payoutTable: [
      { label: 'Множитель x1.5', payout: 'x1.5', probability: '64.00%' },
      { label: 'Множитель x2.0', payout: 'x2.0', probability: '48.00%' },
      { label: 'Множитель x5.0', payout: 'x5.0', probability: '19.20%' },
      { label: 'Множитель x10.0', payout: 'x10.0', probability: '9.60%' },
      { label: 'Множитель x25.0', payout: 'x25.0', probability: '3.84%' },
    ],
    Component: UpgradeGame,
  },
  {
    id: 'dice',
    title: 'Кости',
    shortDescription:
      'Бросок двух трёхмерных кубиков с выбором диапазонов суммы, чётности, дубля или точной комбинации от 2 до 12.',
    category: 'dice-numbers',
    categoryLabel: 'Кости и числа',
    maxMultiplierLabel: 'x34',
    maxMultiplierValue: 34,
    popularityRank: 8,
    featured: false,
    recommended: false,
    minBet: 0.1,
    rules: [
      'Выберите прогноз на результат броска двух шестигранных кубиков (всего 36 равновероятных исходов).',
      'Можно ставить на диапазоны (< 7, = 7, > 7), чёт/нечет, дубль или конкретную сумму от 2 до 12.',
      'Оба кубика вращаются в 3D и останавливаются на выпавших гранях.',
    ],
    payoutTable: [
      { label: 'Чётная / Нечётная сумма', payout: 'x1.95', probability: '18/36 (50.0%)' },
      { label: 'Меньше 7 / Больше 7', payout: 'x2.30', probability: '15/36 (41.67%)' },
      { label: 'Ровно 7 / Дубль', payout: 'x5.70', probability: '6/36 (16.67%)' },
      { label: 'Точная сумма 2 или 12', payout: 'x34.0', probability: '1/36 (2.78%)' },
    ],
    Component: DiceGame,
  },
  {
    id: 'shells',
    title: 'Напёрстки',
    shortDescription:
      'Следите за золотым шариком под тремя стаканчиками с плавной анимацией перемешивания и растущей скоростью серии.',
    category: 'arcade-risk',
    categoryLabel: 'Аркады и риск',
    maxMultiplierLabel: 'x2.97',
    maxMultiplierValue: 2.97,
    popularityRank: 9,
    featured: false,
    recommended: true,
    minBet: 0.1,
    rules: [
      'В начале раунда один из трёх стаканчиков приподнимается, показывая золотой шарик.',
      'Стаканчики опускаются и плавно меняются местами. С каждой победой подряд уровень сложности и скорость растут.',
      'Выбор стаканчика открывается после завершения перемешивания; положение шарика никогда не подменяется после клика.',
    ],
    payoutTable: [
      { label: 'Режим Стандарт', payout: 'x2.85', probability: 'Честная позиция 1 из 3' },
      { label: 'Режим Быстрый', payout: 'x2.92', probability: '8+ перемешиваний' },
      { label: 'Режим Мастер', payout: 'x2.97', probability: '12+ быстрых смен' },
    ],
    Component: ShellsGame,
  },
  {
    id: 'baccarat',
    title: 'Баккара',
    shortDescription:
      'Классическая карточная игра Punto Banco со ставками на Игрока, Банкира или Ничью и правилами третьей карты.',
    category: 'cards',
    categoryLabel: 'Карточные игры',
    maxMultiplierLabel: 'x9.0',
    maxMultiplierValue: 9,
    popularityRank: 10,
    featured: false,
    recommended: false,
    minBet: 0.1,
    rules: [
      'Выберите исход раунда: победа Player (Игрок), победа Banker (Банкир) или Tie (Ничья).',
      'Очки считаются по модулю 10 (Туз = 1, 2–9 по номиналу, 10 и картинки = 0). Побеждает сторона ближе к 9.',
      'Третья карта выдаётся автоматически строго по канонической таблице правил Punto Banco.',
    ],
    payoutTable: [
      { label: 'Победа Player (Игрок)', payout: 'x2.00', probability: '~44.62% (возврат при ничьей)' },
      { label: 'Победа Banker (Банкир)', payout: 'x1.95', probability: '~45.86% (возврат при ничьей)' },
      { label: 'Tie (Ничья)', payout: 'x9.00', probability: '~9.52%' },
    ],
    Component: BaccaratGame,
  },
  {
    id: 'red-black',
    title: 'Красное или чёрное',
    shortDescription:
      'Лаконичная карточная механика с 3D-переворотом закрытой карты: угадайте цвет колоды или точную масть.',
    category: 'cards',
    categoryLabel: 'Карточные игры',
    maxMultiplierLabel: 'x3.9',
    maxMultiplierValue: 3.9,
    popularityRank: 11,
    featured: false,
    recommended: false,
    minBet: 0.1,
    rules: [
      'Перед вами закрытая карта из перетасованной колоды в 52 листа.',
      'Выберите Красное (черви/бубны), Чёрное (пики/трефы) либо одну из четырёх мастей.',
      'Переверните карту и мгновенно получите расчёт результата.',
    ],
    payoutTable: [
      { label: 'Красное / Чёрное', payout: 'x2.00', probability: '26/52 (50.0%)' },
      { label: 'Точная масть карты', payout: 'x3.90', probability: '13/52 (25.0%)' },
    ],
    Component: RedBlackGame,
  },
  {
    id: 'higher-lower',
    title: 'Higher or Lower',
    shortDescription:
      'Угадывайте, окажется следующая карта из колоды старше или младше текущей, накапливая серию и множитель.',
    category: 'cards',
    categoryLabel: 'Карточные игры',
    maxMultiplierLabel: 'Серия x50+',
    maxMultiplierValue: 50,
    popularityRank: 12,
    featured: false,
    recommended: false,
    minBet: 0.1,
    rules: [
      'Младшая карта в игре — Двойка (2), старшая — Туз (A).',
      'Коэффициенты кнопок «Выше» и «Ниже» динамически пересчитываются исходя из оставшихся в колоде карт.',
      'При выпадении равного ранга серия и накопленный множитель сохраняются. Забрать выигрыш можно после любого верного шага.',
    ],
    payoutTable: [
      { label: 'Динамический шаг', payout: 'x1.05 – x12.5', probability: 'Точный расчёт по колоде' },
      { label: 'Равный ранг карты', payout: 'Сохранение серии', probability: 'Нейтральный шаг' },
    ],
    Component: HigherLowerGame,
  },
  {
    id: 'risk-roulette',
    title: 'Риск-рулетка',
    shortDescription:
      'Оригинальное колесо импульсов повышенного риска с тремя профилями волатильности и множителями до x25.',
    category: 'roulette-wheels',
    categoryLabel: 'Рулетка и колёса',
    maxMultiplierLabel: 'x25',
    maxMultiplierValue: 25,
    popularityRank: 13,
    featured: false,
    recommended: false,
    minBet: 0.1,
    rules: [
      'Выберите один из трёх контуров риска: Сбалансированный, Высокий риск или Экстрим.',
      'На колесе расположены 12 равновероятных секторов с различными множителями и безопасными геометрическими символами.',
      'После остановки колеса под верхним указателем мгновенно начисляется множитель выпавшего сектора.',
    ],
    payoutTable: [
      { label: 'Сбалансированный контур', payout: 'до x5.0', probability: '7 призовых из 12' },
      { label: 'Высокий риск', payout: 'до x12.0', probability: '4 призовых из 12' },
      { label: 'Экстремальный пик', payout: 'x8.0 / x25.0', probability: '2 редких из 12' },
    ],
    Component: RiskRouletteGame,
  },
  {
    id: 'keno',
    title: 'Кено',
    shortDescription:
      'Выберите от 1 до 10 любимых чисел на поле из 40 шаров и следите за тиражом с множителями до x600.',
    category: 'dice-numbers',
    categoryLabel: 'Кости и числа',
    maxMultiplierLabel: 'x600',
    maxMultiplierValue: 600,
    popularityRank: 14,
    featured: false,
    recommended: false,
    minBet: 0.1,
    rules: [
      'Отметьте от 1 до 10 чисел на сетке 1–40 (или нажмите «Автовыбор»).',
      'В каждом тираже случайным образом выпадает ровно 10 выигрышных номеров.',
      'Чем больше ваших чисел совпало с выпавшими шарами, тем выше итоговый множитель.',
    ],
    payoutTable: [
      { label: '1 из 1 выбранного', payout: 'x3.80', probability: '10/40 (25.0%)' },
      { label: '3 из 3 выбранных', payout: 'x26.0', probability: '1.21%' },
      { label: '5 из 5 выбранных', payout: 'x120', probability: 'Высокий приз' },
      { label: '10 совпадений', payout: 'x600', probability: 'Максимальный приз' },
    ],
    Component: KenoGame,
  },
  {
    id: 'crash',
    title: 'Crash: Орбита',
    shortDescription:
      'Динамический график растущего орбитального множителя с ручным и автоматическим выводом средств до обрыва сигнала.',
    category: 'arcade-risk',
    categoryLabel: 'Аркады и риск',
    maxMultiplierLabel: 'x200',
    maxMultiplierValue: 200,
    popularityRank: 15,
    featured: false,
    recommended: false,
    minBet: 0.1,
    rules: [
      'Точка завершения импульса определяется криптографически до начала полёта.',
      'Множитель плавно растёт от x1.00 вверх. Нажмите «Забрать» (или настройте Авто-вывод), пока график активен.',
      'Если сигнал обрывается раньше фиксации, ставка сгорает.',
    ],
    payoutTable: [
      { label: 'Ранний вывод x1.50', payout: 'x1.50', probability: '~64.6%' },
      { label: 'Классический x2.00', payout: 'x2.00', probability: '~48.5%' },
      { label: 'Высокая орбита x10.0', payout: 'x10.0', probability: '~9.7%' },
    ],
    Component: CrashGame,
  },
  {
    id: 'russian-roulette',
    title: 'Русская рулетка',
    shortDescription:
      'Раскрутите револьвер на столе, чтобы определить первого стрелка! Три режима: Классическая дуэль, Поочерёдная и Круговой стол на 5 игроков.',
    category: 'arcade-risk',
    categoryLabel: 'Аркады и риск',
    maxMultiplierLabel: 'x5.0',
    maxMultiplierValue: 5,
    popularityRank: 1,
    featured: true,
    recommended: true,
    minBet: 0.1,
    rules: [
      'В начале партии револьвер раскручивается в центре стола: на кого укажет ствол, тот ходит первым. В 6-зарядном барабане находится ровно 1 патрон.',
      'Режим «Классическая дуэль» (2 игрока): выбор выстрела «В себя» или «В соперника». Холостой в себя сохраняет за вами право следующего выстрела, холостой в соперника передаёт ход.',
      'Режим «Поочерёдная» (2 игрока): без выбора цели — участники по очереди стреляют строго в самих себя до первого выбывания.',
      'Режим «Круговой стол» (5 игроков): за столом 5 участников с общим банком x5.0. Если выстрелить в себя и остаться в живых, пистолет оставляют вам ещё на один раз!',
    ],
    payoutTable: [
      { label: 'Классическая дуэль (1 на 1)', payout: 'x2.00', probability: 'Банк двоих участников' },
      { label: 'Поочерёдная (только в себя)', payout: 'x2.00', probability: '50.0% (3 из 6 камор)' },
      { label: 'Круговой стол (5 участников)', payout: 'x5.00', probability: 'Весь банк стола' },
    ],
    Component: RussianRouletteGame,
  },
  {
    id: 'durak',
    title: 'Подкидной Дурак',
    shortDescription:
      'Легендарная карточная игра колодой в 36 листов с козырем, подбрасыванием и тактическими ботами за столом на 2, 3 или 4 человек.',
    category: 'cards',
    categoryLabel: 'Карточные игры',
    maxMultiplierLabel: 'x3.80',
    maxMultiplierValue: 3.8,
    popularityRank: 2,
    featured: true,
    recommended: true,
    minBet: 0.1,
    rules: [
      'Используется колода из 36 карт (от Шестёрки до Туза). Каждому сдаётся по 6 карт, нижняя открытая карта задаёт козырную масть. Первым заходит обладатель младшего козыря.',
      'Атакующий заходит любой картой и может подкидывать карты тех достоинств, которые уже лежат на столе (не более 6 пар и не больше карт на руках у отбивающегося).',
      'Защищающийся обязан побить каждую карту старшей в масть или козырем, либо забрать стол. Победителем становится тот, кто первым выйдет без карт при пустой колоде.',
    ],
    payoutTable: [
      { label: 'Дуэль (2 игрока)', payout: 'x1.95', probability: 'Победа 1 на 1 (ничья x1.0)' },
      { label: 'Стол на 3 игроков', payout: 'x2.85', probability: 'Первый вышедший без карт' },
      { label: 'Стол на 4 игроков', payout: 'x3.80', probability: 'Первый вышедший без карт' },
    ],
    Component: DurakGame,
  },
  {
    id: 'towers',
    title: 'Башня',
    shortDescription:
      'Пошаговое восхождение на 8 этажей с четырьмя уровнями сложности и возможностью забрать выигрыш на любой ступени.',
    category: 'arcade-risk',
    categoryLabel: 'Аркады и риск',
    maxMultiplierLabel: 'x6298',
    maxMultiplierValue: 6298,
    popularityRank: 5,
    featured: false,
    recommended: true,
    minBet: 0.1,
    rules: [
      'Выберите сложность башни: от Лёгкой (3 безопасные ступени из 4) до Экстрима (1 безопасная из 3).',
      'Поднимайтесь с 1-го по 8-й этаж, открывая по одной плитке на каждом ярусе.',
      'Забрать накопленный выигрыш можно после любого успешно пройденного этажа.',
    ],
    payoutTable: [
      { label: 'Лёгкий режим (8 этажей)', payout: 'до x9.59', probability: '75% на этаж' },
      { label: 'Средний режим (8 этажей)', payout: 'до x24.60', probability: '66.7% на этаж' },
      { label: 'Сложный режим (8 этажей)', payout: 'до x245.76', probability: '50% на этаж' },
      { label: 'Экстрим (8 этажей)', payout: 'до x6298.56', probability: '33.3% на этаж' },
    ],
    Component: TowersGame,
  },
  {
    id: 'coin-flip',
    title: 'Орёл или Решка',
    shortDescription:
      'Трёхмерная золотая монета с накоплением победной серии до 10 бросков подряд и мгновенным кэшаутом после каждого шага.',
    category: 'arcade-risk',
    categoryLabel: 'Аркады и риск',
    maxMultiplierLabel: 'x1003',
    maxMultiplierValue: 1003.52,
    popularityRank: 6,
    featured: false,
    recommended: true,
    minBet: 0.1,
    rules: [
      'Последовательность выпадений Орла и Решки генерируется криптографически на старте серии.',
      'Угадайте сторону монеты: первое попадание даёт x1.96, а каждое следующее удваивает коэффициент.',
      'Вы можете забрать деньги сразу после первого броска или продолжить серию до 10 побед подряд.',
    ],
    payoutTable: [
      { label: '1 бросок', payout: 'x1.96', probability: '50.0%' },
      { label: '3 броска подряд', payout: 'x7.84', probability: '12.5%' },
      { label: '5 бросков подряд', payout: 'x31.36', probability: '3.12%' },
      { label: '10 бросков подряд', payout: 'x1003.52', probability: '0.098%' },
    ],
    Component: CoinFlipGame,
  },
  {
    id: 'wheel-of-fortune',
    title: 'Колесо Фортуны',
    shortDescription:
      'Яркое шоу-колесо на 45 секторов со ставками на множители 1, 2, 5, 10, 20 и главный сектор Джекпот 40 (x41).',
    category: 'roulette-wheels',
    categoryLabel: 'Рулетка и колёса',
    maxMultiplierLabel: 'x41',
    maxMultiplierValue: 41,
    popularityRank: 7,
    featured: false,
    recommended: true,
    minBet: 0.1,
    rules: [
      'Отметьте один или сразу несколько целевых секторов (1, 2, 5, 10, 20 или 40) — общая сумма ставки равномерно распределяется по выбранным номерам.',
      'Колесо содержит 45 секторов: частые сектора дают стабильный возврат, а единственный красный сектор 40 приносит выплату x41.',
    ],
    payoutTable: [
      { label: 'Сектор 1 / Сектор 2', payout: 'x2 / x3', probability: '21/45 и 12/45' },
      { label: 'Сектор 5 / Сектор 10', payout: 'x6 / x11', probability: '6/45 и 3/45' },
      { label: 'Сектор 20', payout: 'x21', probability: '2/45 (4.44%)' },
      { label: 'Сектор Джекпот 40', payout: 'x41', probability: '1/45 (2.22%)' },
    ],
    Component: WheelOfFortuneGame,
  },
  {
    id: 'sic-bo',
    title: 'Сик Бо: Три кости',
    shortDescription:
      'Традиционная игра с тремя кубиками под куполом: ставьте на Малые/Большие суммы, совпадения граней, дубли и точные тройни до x180.',
    category: 'dice-numbers',
    categoryLabel: 'Кости и числа',
    maxMultiplierLabel: 'x180',
    maxMultiplierValue: 180,
    popularityRank: 9,
    featured: false,
    recommended: false,
    minBet: 0.1,
    rules: [
      'В каждом раунде одновременно бросаются три шестигранные кости (216 равновероятных комбинаций).',
      'Ставки «Малые (4–10)», «Большие (11–17)» и Чёт/Нечет оплачиваются x2.0 (за исключением выпадения любой тройни).',
      'Ставка на точную тройню (например, 6-6-6) приносит максимальную выплату x180.',
    ],
    payoutTable: [
      { label: 'Малые (4–10) / Большие (11–17)', payout: 'x2.0', probability: '105/216 (48.61%)' },
      { label: 'Число на 1 / 2 / 3 костях', payout: 'x2 / x3 / x12', probability: 'До 3 совпадений' },
      { label: 'Любая тройня (111–666)', payout: 'x31.0', probability: '6/216 (2.78%)' },
      { label: 'Точная тройня', payout: 'x180.0', probability: '1/216 (0.46%)' },
    ],
    Component: SicBoGame,
  },
  {
    id: 'video-poker',
    title: 'Видеопокер',
    shortDescription:
      'Классический 5-карточный автомат Jacks or Better: удерживайте сильные карты, меняйте остальные и собирайте Роял-флеш x800.',
    category: 'cards',
    categoryLabel: 'Карточные игры',
    maxMultiplierLabel: 'x800',
    maxMultiplierValue: 800,
    popularityRank: 10,
    featured: false,
    recommended: false,
    minBet: 0.1,
    rules: [
      'После сдачи 5 карт нажмите на любые карты, чтобы закрепить их («ОСТАВЛЕНО»).',
      'Нажмите «Обменять неприкрытые карты» для однократной замены остальных карт из той же перетасованной колоды.',
      'Выплаты начинаются от пары Валетов и старше (J, Q, K, A) и достигают x800 за Роял-флеш.',
    ],
    payoutTable: [
      { label: 'Роял-флеш / Стрит-флеш', payout: 'x800 / x50', probability: 'Высшие комбинации' },
      { label: 'Каре / Фулл-хаус', payout: 'x25 / x9', probability: 'Сильная рука' },
      { label: 'Флеш / Стрит / Сет', payout: 'x6 / x4 / x3', probability: 'Средний ранг' },
      { label: 'Две пары / Валеты и выше', payout: 'x2 / x1', probability: 'Частый возврат' },
    ],
    Component: VideoPokerGame,
  },
  {
    id: 'scratch-cards',
    title: 'Золотой Скретч',
    shortDescription:
      'Мгновенные скретч-билеты 3×3 в трёх сериях: стирайте защитную фольгу по ячейкам или одним касанием и ловите три символа до x500.',
    category: 'slots',
    categoryLabel: 'Слоты',
    maxMultiplierLabel: 'x500',
    maxMultiplierValue: 500,
    popularityRank: 11,
    featured: false,
    recommended: false,
    minBet: 0.1,
    rules: [
      'Выберите одну из трёх серий билетов (Изумрудный Клевер, Золотой Сейф или Королевский Бриллиант) и купите билет.',
      'Стирайте защитное покрытие с 9 ячеек кликами (или зажатой кнопкой мыши) либо нажмите «Стереть всё сразу».',
      'Если на билете открываются 3 одинаковых множителя, приз мгновенно зачисляется на счёт.',
    ],
    payoutTable: [
      { label: 'Изумрудный Клевер', payout: 'x1.2 – x50', probability: 'Частые совпадения' },
      { label: 'Золотой Сейф', payout: 'x1.5 – x150', probability: 'Средняя волатильность' },
      { label: 'Королевский Бриллиант', payout: 'x1.5 – x500', probability: 'Главный суперприз' },
    ],
    Component: ScratchCardsGame,
  },
];

export function getGameById(id: string | undefined): GameMetadata | undefined {
  return GAME_CATALOG.find((g) => g.id === (id as GameId));
}
