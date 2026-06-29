import React, { useState, useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  LexicalNode,
  NodeKey,
  DecoratorNode,
  $createParagraphNode,
  SerializedLexicalNode,
  Spread,
  LexicalEditor,
} from 'lexical'
import { getMainVariables, getTableVariables } from 'lib/print-variables'
import { $isTableCellNode } from '@lexical/table'
import Popover from '../../Popover'
import { Button } from 'components/legacy-button'

export interface Variable {
  label: string
  value: string
}

export const INSERT_VARIABLE_COMMAND: LexicalCommand<Variable> = createCommand('INSERT_VARIABLE_COMMAND')

interface VariableNodeProps {
  variable: Variable
  nodeKey: NodeKey
}

export type SerializedVariableNode = Spread<
  {
    variable: Variable
  },
  SerializedLexicalNode
>

function VariableComponent({ variable, nodeKey }: VariableNodeProps) {
  return (
    <span
      data-variable-name={variable.value}
      data-variable-label={variable.label}
      data-lexical-node-key={nodeKey}
      className="inline-block rounded bg-blue-100 px-1.5 py-0.5 text-sm font-medium text-blue-800"
    >
      {'{'}
      {variable.label}
      {'}'}
    </span>
  )
}

export class VariableNode extends DecoratorNode<JSX.Element> {
  __variable: Variable

  static getType(): string {
    return 'variable'
  }

  static clone(node: VariableNode): VariableNode {
    return new VariableNode(node.__variable, node.__key)
  }

  constructor(variable: Variable, key?: NodeKey) {
    super(key)
    this.__variable = variable
  }

  createDOM(): HTMLElement {
    const div = document.createElement('span')
    div.className = 'variable-node'
    return div
  }

  updateDOM(): false {
    return false
  }

  decorate(): JSX.Element {
    return <VariableComponent variable={this.__variable} nodeKey={this.__key} />
  }

  exportDOM(): { element: HTMLElement } {
    const span = document.createElement('span')
    span.setAttribute('data-variable', this.__variable.value)
    span.setAttribute('data-variable-label', this.__variable.label)
    span.className = 'template-variable'
    span.innerHTML = `{{${this.__variable.value}}}`
    return { element: span }
  }

  getVariable(): Variable {
    return this.__variable
  }

  isInline(): boolean {
    return true
  }

  exportJSON(): SerializedVariableNode {
    return {
      ...super.exportJSON(),
      variable: this.__variable,
    }
  }

  static importJSON(serializedNode: SerializedVariableNode): VariableNode {
    return new VariableNode(serializedNode.variable)
  }

  static importDOM(): {
    span: () => null | {
      conversion: (element: HTMLElement) => { node: VariableNode | null }
      priority: 1
    }
  } {
    return {
      span: () => ({
        conversion: (element: HTMLElement) => {
          const variableValue = element.getAttribute('data-variable')
          const variableLabel = element.getAttribute('data-variable-label')
          if (variableValue && variableLabel && element.classList.contains('template-variable')) {
            return {
              node: new VariableNode({ value: variableValue, label: variableLabel }),
            }
          }
          return { node: null }
        },
        priority: 1,
      }),
    }
  }
}

export function $createVariableNode(variable: Variable): VariableNode {
  return new VariableNode(variable)
}

export function $isVariableNode(node: LexicalNode | null | undefined): node is VariableNode {
  return node instanceof VariableNode
}

function VariableNodePlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([VariableNode])) {
      throw new Error('VariableNode is not registered in editor.nodes config')
    }
  }, [editor])

  return null
}

const VariableSelectorPopup = ({
  templateKey,
  isTableCell,
  onSelect,
}: {
  templateKey: string
  isTableCell: boolean
  onSelect: (variable: Variable) => void
}) => {
  const tableVariables = getTableVariables(templateKey)
  const mainVariables = getMainVariables(templateKey)

  return (
    <div className="max-w-96">
      {isTableCell && (
        <div className="flex max-h-60 flex-wrap overflow-y-auto">
          {tableVariables.map((variable) => (
            <Button
              key={variable.value}
              title={variable.label}
              variant="text"
              onClick={() => onSelect(variable)}
            />
          ))}
        </div>
      )}
      {isTableCell && <div className="my-2 border-t border-gray-200" />}
      <div className="flex max-h-60 flex-wrap overflow-y-auto">
        {mainVariables.map((variable) => (
          <Button
            key={variable.value}
            title={variable.label}
            variant="text"
            onClick={() => onSelect(variable)}
          />
        ))}
      </div>
    </div>
  )
}

function insertVariable(editor: LexicalEditor, variable: Variable) {
  try {
    editor.update(() => {
      const selection = $getSelection()
      if (!selection) {
        const root = $getRoot()
        const paragraphNode = $createParagraphNode()
        paragraphNode.append($createVariableNode(variable))
        root.append(paragraphNode)
      } else if ($isRangeSelection(selection)) {
        selection.insertNodes([$createVariableNode(variable)])
      }
    })
  } catch (err) {
    console.error('插入变量出错:', err)
  }
}

const VariablePlugin = ({ templateKey }: { templateKey: string }) => {
  const [editor] = useLexicalComposerContext()
  const [isTableCell, setIsTableCell] = useState(false)

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          const nodes = selection.getNodes()
          const hasTableCell = nodes.some((node) => {
            if ($isTableCellNode(node)) return true
            let parent = node.getParent()
            while (parent !== null) {
              if ($isTableCellNode(parent)) return true
              parent = parent.getParent()
            }
            return false
          })
          setIsTableCell(hasTableCell)
        }
      })
    })
  }, [editor])

  useEffect(() => {
    return editor.registerCommand<Variable>(
      INSERT_VARIABLE_COMMAND,
      (variable) => {
        insertVariable(editor, variable)
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  return (
    <>
      <VariableNodePlugin />
      <div className="relative">
        <Popover
          content={
            <VariableSelectorPopup
              templateKey={templateKey}
              isTableCell={isTableCell}
              onSelect={(variable) => insertVariable(editor, variable)}
            />
          }
          trigger="click"
        >
          <button
            type="button"
            className="whitespace-nowrap rounded-lg px-2 py-1 text-sm hover:bg-muted"
            title="插入变量"
          >
            插入变量
          </button>
        </Popover>
      </div>
    </>
  )
}

export default VariablePlugin
