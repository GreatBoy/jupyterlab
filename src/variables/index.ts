// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { Panel, PanelLayout, Widget } from '@phosphor/widgets';

import { Body } from './body';

import { ISignal, Signal } from '@phosphor/signaling';

import { DebugProtocol } from 'vscode-debugprotocol';

export class Variables extends Panel {
  constructor(options: Variables.IOptions) {
    super();

    this.model = options.model;
    this.addClass('jp-DebuggerVariables');
    this.title.label = 'Variables';

    this.header = new VariablesHeader(this.title.label);
    this.body = new Body(this.model);

    this.addWidget(this.header);
    this.addWidget(this.body);
  }

  readonly model: Variables.Model;
  readonly header: VariablesHeader;
  readonly body: Widget;

  protected onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg);
    this.resizeBody(msg);
  }

  private resizeBody(msg: Widget.ResizeMessage) {
    const height = msg.height - this.header.node.offsetHeight;
    this.body.node.style.height = `${height}px`;
  }
}

class VariablesHeader extends Widget {
  constructor(title: string) {
    super({ node: document.createElement('header') });
    const layout = new PanelLayout();
    const span = new Widget({ node: document.createElement('span') });

    this.layout = layout;
    span.node.textContent = title;
    layout.addWidget(span);
  }
}

export namespace Variables {
  export interface IVariable extends DebugProtocol.Variable {
    getMoreDetails?: any;
    haveMoreDetails?: Symbol;
  }

  export interface IScope {
    name: string;
    variables: IVariable[];
  }

  export class Model {
    constructor(model: IScope[] = []) {
      this._state = model;
    }

    get scopesChanged(): ISignal<this, IScope[]> {
      return this._scopesChanged;
    }

    get currentVariable(): IVariable {
      return this._currentVariable;
    }

    set currentVariable(variable: IVariable) {
      if (this._currentVariable === variable) {
        return;
      }

      variable.haveMoreDetails = Symbol('haveDetails');
      this._currentVariable = variable;
      this._currentChanged.emit(variable);

      const newScope = this.scopes.map(scope => {
        const findIndex = scope.variables.findIndex(
          ele => ele.variablesReference === variable.variablesReference
        );
        scope.variables[findIndex] = variable;
        return { ...scope };
      });
      this.scopes = [...newScope];
    }

    get scopes(): IScope[] {
      return this._state;
    }

    set scopes(scopes: IScope[]) {
      this._state = scopes;
      this._scopesChanged.emit(scopes);
    }

    get variables(): IVariable[] {
      return this._currentScope ? this._currentScope.variables : [];
    }

    set variables(variables: IVariable[]) {
      this._currentScope.variables = variables;
    }

    get variablesChanged(): ISignal<this, IVariable[]> {
      return this._variablesChanged;
    }

    get variableExapnded(): ISignal<this, IVariable> {
      return this._variableExapnded;
    }

    getCurrentVariables(): IVariable[] {
      return this.variables;
    }

    async getMoreDataOfVariable(variable: IVariable) {
      this._variableExapnded.emit(variable);
    }

    protected _state: IScope[];

    private _currentVariable: IVariable;
    private _currentScope: IScope;

    private _currentChanged = new Signal<this, IVariable>(this);
    private _variablesChanged = new Signal<this, IVariable[]>(this);
    private _scopesChanged = new Signal<this, IScope[]>(this);
    private _variableExapnded = new Signal<this, IVariable>(this);
  }

  export interface IOptions extends Panel.IOptions {
    model: Model;
  }
}
