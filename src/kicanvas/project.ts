/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { sorted_by_numeric_strings } from "../base/array";
import { Barrier } from "../base/async";
import { type IDisposable } from "../base/disposable";
import { first, length } from "../base/iterator";
import { Logger } from "../base/log";
import { is_string, type Constructor } from "../base/types";
import { KicadFootprint } from "../ecad-viewer/model/footprint/kicad_footprint";
import { KicadSymbolLib } from "../ecad-viewer/model/lib_symbol/kicad_symbol_lib";
import { KicadPCB, KicadSch, ProjectSettings } from "../kicad";

import type { VirtualFileSystem } from "./services/vfs";

const log = new Logger("kicanvas:project");

export class Project extends EventTarget implements IDisposable {
    #fs: VirtualFileSystem;
    #files_by_name: Map<
        string,
        KicadPCB | KicadSch | null | KicadFootprint | KicadSymbolLib
    > = new Map();
    public active_page_name?: string;

    public loaded: Barrier = new Barrier();
    public settings: ProjectSettings = new ProjectSettings();
    #root_schematic_page?: ProjectPage;

    public get filesByIndex() {
        return this.#files_by_name;
    }

    public dispose() {
        this.#files_by_name.clear();
    }

    public async load(fs: VirtualFileSystem) {
        log.info(`Loading project from ${fs.constructor.name}`);

        this.settings = new ProjectSettings();
        this.#files_by_name.clear();

        this.#fs = fs;

        const promises = [];

        for (const filename of this.#fs.list()) {
            promises.push(this.#load_file(filename));
        }

        await Promise.all(promises);

        this.loaded.open();

        this.dispatchEvent(
            new CustomEvent("load", {
                detail: this,
            }),
        );
    }
    public get root_schematic_page() {
        return this.#root_schematic_page;
    }

    async #load_file(filename: string) {
        log.info(`Loading file ${filename}`);

        if (filename.endsWith(".kicad_sch")) {
            return await this.#load_doc(KicadSch, filename);
        }
        if (filename.endsWith(".kicad_pcb")) {
            return await this.#load_doc(KicadPCB, filename);
        }
        if (filename.endsWith(".kicad_sym")) {
            return await this.#load_doc(KicadSymbolLib, filename);
        }
        if (filename.endsWith(".kicad_mod")) {
            return await this.#load_doc(KicadFootprint, filename);
        }
        if (filename.endsWith(".kicad_pro")) {
            return this.#load_meta(filename);
        }

        log.warn(`Couldn't load ${filename}: unknown file type`);
    }

    async #load_doc(
        document_class: Constructor<
            KicadPCB | KicadSch | KicadSymbolLib | KicadFootprint
        >,
        filename: string,
    ) {
        if (this.#files_by_name.has(filename)) {
            return this.#files_by_name.get(filename);
        }
        const text = await this.#get_file_text(filename);
        const doc = new document_class(filename, text);
        doc.project = this;

        this.#files_by_name.set(filename, doc);
        return;
    }

    async #load_meta(filename: string) {
        const text = await this.#get_file_text(filename);
        const data = JSON.parse(text);
        this.settings = ProjectSettings.load(data);
    }

    async #get_file_text(filename: string) {
        return await (await this.#fs.get(filename)).text();
    }

    public *files() {
        yield* this.#files_by_name.values();
    }

    public file_by_name(name: string) {
        for (const [, v] of this.#files_by_name) if (v) return v;

        return this.#files_by_name.get(name);
    }

    public *boards() {
        for (const value of this.#files_by_name.values()) {
            if (value instanceof KicadPCB || value instanceof KicadFootprint) {
                yield value;
            }
        }
    }

    public get has_boards() {
        return length(this.boards()) > 0;
    }

    public *schematics() {
        for (const value of this.#files_by_name.values()) {
            if (value instanceof KicadSch || value instanceof KicadSymbolLib) {
                yield value;
            }
        }
    }

    public get has_schematics() {
        return length(this.schematics()) > 0;
    }

    public *pages() {
        yield* this.#files_by_name.values();
    }

    public get first_page() {
        return first(this.pages());
    }

    public page_by_path(project_path: string) {
        return this.#files_by_name.get(project_path);
    }

    public async download(name: string) {
        if (this.#files_by_name.has(name)) {
            name = this.#files_by_name.get(name)!.filename;
        }
        return await this.#fs.download(name);
    }

    public activate(page_or_path?: string) {
        this.active_page_name = page_or_path;
        this.dispatchEvent(
            new CustomEvent("change", {
                detail: this,
            }),
        );
    }
}

export class ProjectPage {
    constructor(
        public project: Project,
        public type: "pcb" | "schematic",
        public filename: string,
        public sheet_path: string,
        public name?: string,
        public page?: string,
    ) {}

    /**
     * A unique identifier for this page within the project,
     * made from the filename and sheet path.
     */
    get project_path() {
        if (this.sheet_path) {
            return `${this.filename}:${this.sheet_path}`;
        } else {
            return this.filename;
        }
    }

    get document() {
        return this.project.file_by_name(this.filename)!;
    }
}
