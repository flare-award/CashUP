import { GameId } from '../types';
import { BaccaratGame } from './baccarat/BaccaratGame';
import { BlackjackGame } from './blackjack/BlackjackGame';
import { CrashGame } from './crash/CrashGame';
import { DiceGame } from './dice/DiceGame';
import { HigherLowerGame } from './higherLower/HigherLowerGame';
import { KenoGame } from './keno/KenoGame';
import { MinesGame } from './mines/MinesGame';
import { PlinkoGame } from './plinko/PlinkoGame';
import { PokerGame } from './poker/PokerGame';
import { RedBlackGame } from './redBlack/RedBlackGame';
import { RiskRouletteGame } from './riskRoulette/RiskRouletteGame';
import { RouletteGame } from './roulette/RouletteGame';
import { ShellsGame } from './shells/ShellsGame';
import { SlotsGame } from './slots/SlotsGame';
import { GameMetadata } from './types';
import { UpgradeGame } from './upgrade/UpgradeGame';

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
    title: 'Техасский Холдем',
    shortDescription:
      'Полноценный покер за 4-местным столом против трёх соперников с разными тактиками и всеми улицами торгов от префлопа до ривера.',
    category: 'cards',
    categoryLabel: 'Карточные игры',
    maxMultiplierLabel: 'Банк x4+',
    maxMultiplierValue: 8,
    popularityRank: 4,
    featured: true,
    recommended: true,
    minBet: 0.1,
    rules: [
      'Каждому участнику раздаются 2 карманные карты, а на стол поэтапно выкладываются 5 общих карт (Флоп, Тёрн, Ривер).',
      'На каждой улице доступны действия Чек, Колл, Рейз или Фолд.',
      'Соперники за столом принимают решения строго на основе своих двух карт, открытых карт борда и размера банка — без доступа к вашим картам или будущей колоде.',
    ],
    payoutTable: [
      { label: 'Победа лучшей 5-карточной комбинацией', payout: '100% банка', probability: 'По силе руки' },
      { label: 'Победа фолдом всех соперников', payout: '100% банка', probability: 'Тактический розыгрыш' },
      { label: 'Равная лучшая комбинация', payout: 'Раздел банка', probability: 'Split Pot' },
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
];

export function getGameById(id: string | undefined): GameMetadata | undefined {
  return GAME_CATALOG.find((g) => g.id === (id as GameId));
}
