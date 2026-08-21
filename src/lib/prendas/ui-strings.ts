export const UI = {
  buttons: {
    save: "Guardar peça",
    saveChanges: "Guardar canvis",
    delete: "Eliminar",
    close: "Tancar",
    clearFilters: "Netejar filtres",
    edit: "Editar",
  },
  form: {
    category: "Categoria",
    colors: "Colors",
    texture: "Textura",
    pattern: "Dibuix",
    seasons: "Temporada",
    size: "Talla",
    subtype: "Tipus",
    length: "Llargada",
    fit: "Tall",
    notes: "Notes",
    required: "*",
  },
  errors: {
    requiredFields: "Omple tots els camps marcats amb *",
    minOneSeason: "Selecciona almenys una temporada",
    minOneColor: "Selecciona almenys un color",
    invalidColor: "Color no valid",
  },
  modal: {
    texture: "Textura",
    pattern: "Dibuix",
    colors: "Colors",
    seasons: "Temporada",
    notes: "Notes",
  },
  grid: {
    filters: "Filtres",
    categories: "Categoria",
    seasons: "Temporada",
    fits: "Tall",
    textures: "Textura",
    noResults: "Cap peça trobada",
    results: (count: number) => `${count} peça${count !== 1 ? "s" : ""}`,
  },
  bugaderia: {
    title: "bugaderia",
    subtitle: "què tens net i què tens al cistell.",
    soil: "Embrutar",
    wash: "Rentar",
    today: "Què em poso?",
    cleanCount: (n: number) => (n === 1 ? "1 peça neta" : `${n} peces netes`),
    basketCount: (n: number) =>
      n === 1 ? "1 peça al cistell" : `${n} peces al cistell`,
    picker: {
      soil: {
        title: "Embrutar",
        subtitle: "tria les peces que van al cistell.",
        submit: "Al cistell",
        submitting: "marcant…",
        empty: "totes les peces ja són al cistell.",
      },
      wash: {
        title: "Rentar",
        subtitle: "tria les peces que has rentat.",
        submit: "Rentat",
        submitting: "marcant…",
        empty: "cap peça al cistell. tot net.",
        didLaundry: "he fet la bugada",
      },
      clearSelection: "Desmarcar-ho tot",
    },
    grid: {
      state: "Estat",
      clean: "Netes",
      dirty: "Brutes",
      badge: "al cistell",
    },
  },
  outfits: {
    // The screen is one question, so it is titled with the question.
    screenTitle: "Què em poso?",
    /**
     * The three strata of that screen, top to bottom: the answer, the
     * week the answer sits in, and the collection it came from. Same
     * noun at three distances in time, which is why they are one screen.
     */
    sections: {
      today: "avui",
      week: "la setmana",
      all: "tots els outfits",
    },
    todayUndecided: "encara per decidir",
    changeToday: "canviar",
    filtersLabel: "Filtrar outfits",
    filters: {
      ready: "a punt",
      all: "tots",
    },
    pickForMe: "tria per mi",
    today: "avui",
    // "al cistell" describes where the piece is; on an outfit what you
    // need to know is what to do about it.
    inBasket: "per rentar",
    blockedReason: (pieces: string[]) => `cal rentar ${pieces.join(" i ")}`,
    howYouWearIt: "com el portes",
    shoes: "sabates",
    accessories: "accessoris",
    socks: "mitjons",
    noShoes: "cap sabata desada.",
    noAccessories: "cap accessori desat.",
    goToAdd: "afegir una peça",
    wearToday: "Me'l poso",
    wearOnDay: (day: string) => `Desar per ${day}`,
    saving: "desant…",
    delete: "eliminar",
    deleteConfirm: "sí, eliminar",
    deleting: "eliminant…",
    cancel: "cancel·lar",
    // The outfit only carries its three most recent past days, so beyond
    // that the count would understate what the cascade really deletes.
    deleteCost: (n: number) =>
      n === 1
        ? "s'esborrarà també 1 dia del calendari."
        : `s'esborraran també ${n} dies del calendari.`,
    deleteCostMany: "s'esborraran també els dies del calendari on el portaves.",
    changeOutfit: "canviar d'outfit",
    removeFromDay: "treure del dia",
    emptyNoOutfits: "encara no tens outfits desats",
    emptyNoOutfitsBrowse: "encara no hi ha res desat.",
    emptyNoOutfitsHint:
      "obre una peça de l'armari i mira què hi combina per desar el primer.",
    emptyNoneReady: "toca fer bugada",
    emptyReady: "cap outfit a punt ara mateix.",
    goToArmari: "anar a l'armari",
    goToRentar: "anar a rentar",
    plan: "planificar",
    back: "tornar",
    planned: "planificat",
  },
} as const;
