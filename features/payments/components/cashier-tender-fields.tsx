'use client'

import { Button, Flex, Stack, Text } from '@chakra-ui/react'
import { useMemo } from 'react'

import { ButtonGroup, DecimalInput, FormField } from '@/components/dashboard'
import {
  CASH_DENOMINATIONS,
  computeCashChange,
  roundMoney,
} from '@/features/payments/tender'

type CashierTenderFieldsProps = {
  collectAmount: number
  onCollectAmountChange: (value: number) => void
  amountTendered: number
  onAmountTenderedChange: (value: number) => void
  collectInputKey: string
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

export function CashierTenderFields({
  collectAmount,
  onCollectAmountChange,
  amountTendered,
  onAmountTenderedChange,
  collectInputKey,
}: CashierTenderFieldsProps) {
  const changeResult = useMemo(
    () => computeCashChange(collectAmount, amountTendered),
    [collectAmount, amountTendered]
  )
  const changeDue = changeResult.ok ? changeResult.changeGiven : 0
  const tenderValid = changeResult.ok && collectAmount > 0

  return (
    <Stack gap={3}>
      <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
        <FormField label="Amount to collect" required flex="1">
          <DecimalInput
            key={collectInputKey}
            name="amountPaid"
            min="0.01"
            step="0.01"
            required
            value={collectAmount > 0 ? collectAmount : ''}
            onChange={(event) => {
              const parsed = Number.parseFloat(event.currentTarget.value)
              onCollectAmountChange(Number.isNaN(parsed) ? 0 : parsed)
            }}
            data-testid="cashier-amount-paid"
          />
        </FormField>
        <FormField label="Cash tendered" required flex="1">
          <DecimalInput
            name="amountTendered"
            min="0"
            step="0.01"
            required
            value={amountTendered > 0 ? amountTendered : ''}
            onChange={(event) => {
              const parsed = Number.parseFloat(event.currentTarget.value)
              onAmountTenderedChange(Number.isNaN(parsed) ? 0 : parsed)
            }}
            data-testid="cashier-amount-tendered"
          />
        </FormField>
      </Flex>

      <Text
        fontSize="md"
        fontWeight="semibold"
        color={tenderValid ? 'green.600' : 'red.500'}
        data-testid="cashier-change-due"
      >
        Change due: {formatCurrency(changeDue)}
      </Text>

      <ButtonGroup flexWrap="wrap">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onAmountTenderedChange(roundMoney(collectAmount))}
          disabled={collectAmount <= 0}
          data-testid="cashier-tender-exact"
        >
          Exact
        </Button>
        {CASH_DENOMINATIONS.map((denomination) => (
          <Button
            key={denomination}
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onAmountTenderedChange(roundMoney(amountTendered + denomination))
            }
            data-testid={`cashier-tender-${denomination}`}
          >
            ₱{denomination}
          </Button>
        ))}
      </ButtonGroup>
    </Stack>
  )
}

export function isCashierTenderValid(collectAmount: number, amountTendered: number) {
  if (collectAmount <= 0) return false
  return computeCashChange(collectAmount, amountTendered).ok
}
