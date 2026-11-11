export namespace frontend {
	
	export class ScreenSize {
	    width: number;
	    height: number;
	
	    static createFrom(source: any = {}) {
	        return new ScreenSize(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.width = source["width"];
	        this.height = source["height"];
	    }
	}
	export class Screen {
	    isCurrent: boolean;
	    isPrimary: boolean;
	    width: number;
	    height: number;
	    size: ScreenSize;
	    physicalSize: ScreenSize;
	
	    static createFrom(source: any = {}) {
	        return new Screen(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.isCurrent = source["isCurrent"];
	        this.isPrimary = source["isPrimary"];
	        this.width = source["width"];
	        this.height = source["height"];
	        this.size = this.convertValues(source["size"], ScreenSize);
	        this.physicalSize = this.convertValues(source["physicalSize"], ScreenSize);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace main {
	
	export class BibleVerse {
	    chapter: number;
	    verse: number;
	    name: string;
	    text: string;
	
	    static createFrom(source: any = {}) {
	        return new BibleVerse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.chapter = source["chapter"];
	        this.verse = source["verse"];
	        this.name = source["name"];
	        this.text = source["text"];
	    }
	}
	export class BibleChapter {
	    chapter: number;
	    name: string;
	    verses: BibleVerse[];
	
	    static createFrom(source: any = {}) {
	        return new BibleChapter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.chapter = source["chapter"];
	        this.name = source["name"];
	        this.verses = this.convertValues(source["verses"], BibleVerse);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class BibleBook {
	    nr: number;
	    name: string;
	    chapters: BibleChapter[];
	
	    static createFrom(source: any = {}) {
	        return new BibleBook(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nr = source["nr"];
	        this.name = source["name"];
	        this.chapters = this.convertValues(source["chapters"], BibleChapter);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class BibleVersion {
	    id: string;
	    translation: string;
	    abbreviation: string;
	    description: string;
	    language: string;
	    direction: string;
	    encoding: string;
	    distribution_version: string;
	    distribution_abbreviation: string;
	    books: BibleBook[];
	
	    static createFrom(source: any = {}) {
	        return new BibleVersion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.translation = source["translation"];
	        this.abbreviation = source["abbreviation"];
	        this.description = source["description"];
	        this.language = source["language"];
	        this.direction = source["direction"];
	        this.encoding = source["encoding"];
	        this.distribution_version = source["distribution_version"];
	        this.distribution_abbreviation = source["distribution_abbreviation"];
	        this.books = this.convertValues(source["books"], BibleBook);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PresentationState {
	    title: string;
	    text: string;
	    backgroundVersion: number;
	
	    static createFrom(source: any = {}) {
	        return new PresentationState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.text = source["text"];
	        this.backgroundVersion = source["backgroundVersion"];
	    }
	}
	export class Song {
	    id: string;
	    title: string;
	    artist: string;
	    lyrics: string;
	    background: string;
	    verseNumbers: number[];
	
	    static createFrom(source: any = {}) {
	        return new Song(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.artist = source["artist"];
	        this.lyrics = source["lyrics"];
	        this.background = source["background"];
	        this.verseNumbers = source["verseNumbers"];
	    }
	}

}

