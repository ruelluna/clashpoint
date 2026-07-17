'use client'

import { Box, Button, Flex, Input, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import type { CompetitorListItem } from '@/features/competitors/types'

type OwnersListClientProps = {
  owners: CompetitorListItem[]
  canManage: boolean
}

export function OwnersListClient({ owners, canManage }: OwnersListClientProps) {
  const [search, setSearch] = useState('')

  const filteredOwners = useMemo(() => {
    const trimmed = search.trim().toLowerCase()
    if (!trimmed) return owners
    return owners.filter((owner) => {
      const haystack = [
        owner.displayName,
        owner.contactNumber,
        owner.email,
        owner.address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(trimmed)
    })
  }, [owners, search])

  return (
    <PageStack>
      <PageHeader
        title="Owners & game farms"
        description="Manage saved owner names and game farms used when encoding rooster entries."
        actions={
          canManage ? (
            <Button asChild alignSelf={{ base: 'flex-start', md: 'auto' }}>
              <Link href="/dashboard/owners/new">Add owner</Link>
            </Button>
          ) : undefined
        }
      />

      <Flex align="center" gap={3} maxW="md">
        <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap">
          Search
        </Text>
        <Input
          size="sm"
          placeholder="Filter by name, contact, or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Flex>

      <PanelCard flush>
        <Flex
          px={4}
          py={3}
          borderBottomWidth="1px"
          borderColor="border"
          fontWeight="medium"
          fontSize="sm"
          display={{ base: 'none', lg: 'flex' }}
        >
          <Box flex="2">Owner / game farm</Box>
          <Box flex="1">Contact</Box>
          <Box flex="1">Email</Box>
        </Flex>
        {filteredOwners.length === 0 ? (
          <Box px={4} py={8} textAlign="center">
            <Text color="fg.muted">
              {owners.length === 0
                ? 'No owners registered yet.'
                : 'No owners match this search.'}
            </Text>
          </Box>
        ) : (
          filteredOwners.map((owner) => (
            <Link key={owner.id} href={`/dashboard/owners/${owner.id}`}>
              <Flex
                px={4}
                py={3}
                borderBottomWidth="1px"
                borderColor="border"
                direction={{ base: 'column', lg: 'row' }}
                gap={2}
                align={{ lg: 'center' }}
                _hover={{ bg: 'bg.subtle' }}
              >
                <Box flex="2">
                  <Text fontWeight="medium">{owner.displayName}</Text>
                  {owner.address ? (
                    <Text fontSize="sm" color="fg.muted">
                      {owner.address}
                    </Text>
                  ) : null}
                </Box>
                <Box flex="1">
                  <Text fontSize="sm">{owner.contactNumber ?? '—'}</Text>
                </Box>
                <Box flex="1">
                  <Text fontSize="sm">{owner.email ?? '—'}</Text>
                </Box>
              </Flex>
            </Link>
          ))
        )}
      </PanelCard>
    </PageStack>
  )
}
