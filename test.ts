import * as ts from 'typescript';
import { Node, ParameterDeclaration, SyntaxKind } from 'typescript';
import { readFileSync } from 'fs';

const DECORATOR_NAME = 'RpcHandler';

type ParamsOpenRPC = {
  name: string;
  description?: string;
  required: boolean;
  schema: {
    type: string | undefined;
  };
};

function getDeclaration(
  node: Node,
  nameDeclaration: SyntaxKind,
  findone: true
): undefined | Node;
function getDeclaration(
  node: Node,
  nameDeclaration: SyntaxKind,
  findone: false
): Node[];
function getDeclaration(
  node: Node,
  nameDeclaration: SyntaxKind,
  findone: boolean
): undefined | Node | Node[] {
  const result: Node[] = [];
  function iterate(node: Node) {
    if (node.kind === nameDeclaration) {
      result.push(node);
    }
    if (findone && result.length === 1) return;
    ts.forEachChild(node, iterate);
  }

  iterate(node);

  return findone ? result.shift() : result;
}

function getName(node: Node): string | null {
  const identifier = getDeclaration(node, SyntaxKind.Identifier, true);
  if (!identifier) return null;
  return identifier.getText().replace('\n ', '');
}

function getMethodForClass(node: Node): Node[] {
  const methodDeclaration = getDeclaration(
    node,
    SyntaxKind.MethodDeclaration,
    false
  );
  return methodDeclaration.filter((i) => {
    const isPrivate = !!getDeclaration(i, SyntaxKind.PrivateKeyword, true);
    if (isPrivate) return false;
    const isPrivateIdentifier = !!getDeclaration(
      i,
      SyntaxKind.PrivateIdentifier,
      true
    );
    if (isPrivateIdentifier) return false;
    const isProtected = !!getDeclaration(i, SyntaxKind.ProtectedKeyword, true);
    return !isProtected;
  });
}

function getParams(node: Node): ParamsOpenRPC[][] {
  const methodDeclaration = getMethodForClass(node);
  return methodDeclaration.map((method) => {
    return getDeclaration(method, SyntaxKind.Parameter, false)
      .map<ParamsOpenRPC | null>((i, index) => {
        let param = i as ParameterDeclaration;
        let type = undefined;
        if (param.type) {
          if (param.type.kind !== SyntaxKind.TypeReference) {
            type = param.type.getText();
          }
        }
        return {
          name: param.name.getText(),
          required: !!param.questionToken,
          schema: {
            type,
          },
        };
      })
      .filter((i): i is ParamsOpenRPC => !!i);
  });
}

export function workWithFile(file: string) {
  const code = readFileSync(file, 'utf-8');
  const sc = ts.createSourceFile('x.ts', code, ts.ScriptTarget.Latest, true);

  const classList = getDeclaration(
    sc,
    SyntaxKind.ClassDeclaration,
    false
  ).filter((item) => {
    const decoratorForClass = getDeclaration(item, SyntaxKind.Decorator, true);
    if (!decoratorForClass) return false;
    const callExpression = getDeclaration(
      decoratorForClass,
      SyntaxKind.CallExpression,
      true
    );
    if (!callExpression) return false;
    const identifier = getName(callExpression);
    if (!identifier) return false;
    return identifier === DECORATOR_NAME;
  });

  const methods = classList.reduce<string[]>((acum, item) => {
    const methods = getMethodForClass(item)
      .map((i) => getName(i))
      .filter((i): i is string => !!i);
    const params = getParams(item);
    console.log(JSON.stringify(params));
    return acum;
  }, []);
}

workWithFile('apps/json-api-server/src/app/rpc/service/rpc.service.ts');
